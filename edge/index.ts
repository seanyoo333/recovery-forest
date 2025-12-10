// supabase/functions/ocr/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

interface OcrRequestPayload {
  imageBase64?: string;
  imageHash?: string;
  userId?: string;
}

// ===== JWT & OAuth2 helper for Google service account =====

interface GoogleServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getAccessTokenFromServiceAccount(sa: GoogleServiceAccount): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  // Vision API 범위: cloud-platform 통합 스코프 사용
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: sa.token_uri, // "https://oauth2.googleapis.com/token"
    scope: "https://www.googleapis.com/auth/cloud-platform",
    iat: now,
    exp: now + 3600, // 1시간 유효
  };

  const encoder = new TextEncoder();
  const headerPart = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerPart}.${payloadPart}`;

  // private_key (PEM) -> CryptoKey 로 변환
  const pem = sa.private_key;
  const pemBody = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsignedToken));

  const signedJwt = `${unsignedToken}.${base64UrlEncode(signature)}`;

  // JWT를 이용해 access_token 요청
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Failed to get access_token:", errText);
    throw new Error(`Failed to get access_token: ${res.status}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token is empty" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 토큰으로 사용자 확인
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({
          error: `Authentication failed: ${authError.message}`,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { imageBase64, imageHash }: OcrRequestPayload = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔹 해시 기반 캐시 (blood_test_images + blood_test_results 사용)
    // 테이블 없으면 에러만 찍고 넘어가므로 기능적으로는 안전
    if (imageHash) {
      try {
        const { data: existingImage, error: imageQueryError } = await supabase
          .from("blood_test_images")
          .select("image_id, test_date")
          .eq("patient_id", user.id)
          .eq("image_hash", imageHash)
          .maybeSingle();

        if (!imageQueryError && existingImage) {
          const { data: allResults, error: allResultsError } = await supabase
            .from("blood_test_results")
            .select(
              `
              result_value,
              result_unit,
              test_date,
              blood_test_types!inner(standard_name)
            `,
            )
            .eq("patient_id", user.id)
            .eq("image_id", existingImage.image_id)
            .order("test_date", { ascending: false });

          if (!allResultsError && allResults && allResults.length > 0) {
            const testDate = existingImage.test_date || "";

            const structured: Record<string, string> = {
              wbc: "",
              rbc: "",
              hgb: "",
              hct: "",
              mcv: "",
              mchc: "",
              platelet: "",
              rdw: "",
              pdw: "",
              neutrophil: "",
              lymphocyte: "",
              monocyte: "",
              eosinophil: "",
              basophil: "",
              totalBilirubin: "",
              ast: "",
              alt: "",
              gtp: "",
              bun: "",
              creatinine: "",
              egfr: "",
              uricAcid: "",
              glucose: "",
              triglyceride: "",
              hdl: "",
              ldl: "",
              freeT3: "",
              freeT4: "",
              tsh: "",
              homocysteine: "",
              vitaminD: "",
              hgbA1c: "",
              scc: "",
              cea: "",
              ca199: "",
              ca125: "",
              ca153: "",
              psa: "",
              afp: "",
              ca724: "",
              nse: "",
              lmr: "",
              nlr: "",
              crp: "",
              cholesterol: "",
              ldh: "",
              testDate: testDate,
            };

            const standardNameMap: Record<string, string> = {
              wbc: "wbc",
              rbc: "rbc",
              hgb: "hgb",
              hct: "hct",
              mcv: "mcv",
              mchc: "mchc",
              platelet: "platelet",
              rdw: "rdw",
              pdw: "pdw",
              neutrophil: "neutrophil",
              lymphocyte: "lymphocyte",
              monocyte: "monocyte",
              eosinophil: "eosinophil",
              basophil: "basophil",
              total_bilirubin: "totalBilirubin",
              ast: "ast",
              alt: "alt",
              gtp: "gtp",
              bun: "bun",
              creatinine: "creatinine",
              egfr: "egfr",
              uric_acid: "uricAcid",
              glucose: "glucose",
              triglyceride: "triglyceride",
              hdl: "hdl",
              ldl: "ldl",
              free_t3: "freeT3",
              free_t4: "freeT4",
              tsh: "tsh",
              homocysteine: "homocysteine",
              vitamin_d: "vitaminD",
              hgba1c: "hgbA1c",
              scc: "scc",
              cea: "cea",
              ca199: "ca199",
              ca125: "ca125",
              ca153: "ca153",
              psa: "psa",
              afp: "afp",
              ca724: "ca724",
              nse: "nse",
              lmr: "lmr",
              nlr: "nlr",
              crp: "crp",
              cholesterol: "cholesterol",
              ldh: "ldh",
              testDate: "testDate",
            };

            for (const result of allResults as any[]) {
              const standardName = result.blood_test_types?.standard_name;
              if (standardName && standardNameMap[standardName]) {
                const fieldName = standardNameMap[standardName];
                structured[fieldName] = String(result.result_value ?? "");
              }
            }

            return new Response(
              JSON.stringify({
                structured,
                cached: true,
                message: "기존 데이터를 반환했습니다.",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
        }
      } catch (cacheError) {
        // 캐시 관련 에러는 로깅만 하고, OCR 계속 진행
        console.error("Cache lookup error:", cacheError);
      }
    }

    const saJson = Deno.env.get("GOOGLE_VISION_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      throw new Error("GOOGLE_VISION_SERVICE_ACCOUNT_JSON is not set");
    }
    const serviceAccount = JSON.parse(saJson) as GoogleServiceAccount;
    const accessToken = await getAccessTokenFromServiceAccount(serviceAccount);
    // data:image/...;base64, 이런 prefix가 있으면 정리
    const cleanedBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    // 검사 항목 variations 정의
    const metricVariations: Record<string, string[]> = {
      wbc: ["wbc", "WBC", "백혈구", "백혈구수", "Leukocyte", "White Blood Cell Count"],
      rbc: ["rbc", "RBC", "적혈구", "적혈구수", "Red Blood Cell Count"],
      hgb: ["hgb", "Hb", "HGB", "헤모글로빈", "혈색소", "Hemoglobin"],
      hct: ["hct", "HCT", "헤마토크릿", "적혈구용적률", "Hematocrit"],
      mcv: ["mcv", "MCV", "평균적혈구용적", "Mean Corpuscular Volume"],
      mchc: ["mchc", "MCHC", "평균적혈구혈색소농도", "Mean Corpuscular Hemoglobin Concentration"],
      platelet: ["platelet", "PLT", "platelets", "혈소판", "혈소판수", "Platelet Count"],
      rdw: ["rdw", "RDW", "적혈구분포폭", "Red Cell Distribution Width"],
      pdw: ["pdw", "PDW", "혈소판분포폭", "Platelet Distribution Width"],
      neutrophil: ["neutrophil", "NEUT", "NE%", "중성구", "호중구", "Neutrophils", "Neutro"],
      lymphocyte: ["lymphocyte", "LYM", "LY%", "림프구", "Lymphocyte", "Lymph"],
      monocyte: ["monocyte", "MONO", "MO%", "단핵구", "Monocyte"],
      eosinophil: ["eosinophil", "EOS", "EO%", "호산구", "Eosinophil"],
      basophil: ["basophil", "BASO", "BA%", "호염구", "Basophil"],
      totalBilirubin: ["total_bilirubin", "T-bilirubin", "TBIL", "총빌리루빈", "Total Bilirubin"],
      ast: ["ast", "AST", "GOT", "아스파테이트아미노전달효소", "간수치AST"],
      alt: ["alt", "ALT", "GPT", "알라닌아미노전달효소", "간수치ALT"],
      gtp: ["gtp", "GGT", "γ-GTP", "Gamma-GTP", "감마지티피", "GTP"],
      bun: ["bun", "BUN", "혈중요소질소", "Blood Urea Nitrogen"],
      creatinine: ["creatinine", "CRE", "Cr", "크레아티닌", "Creatinine"],
      egfr: ["egfr", "eGFR", "추정사구체여과율", "사구체여과율", "Glomerular Filtration Rate"],
      uricAcid: ["uric_acid", "UA", "요산", "Uric Acid"],
      glucose: ["glucose", "GLU", "혈당", "포도당", "Glucose", "FBS", "공복혈당"],
      triglyceride: ["triglyceride", "TG", "중성지방", "Triglycerides"],
      hdl: ["hdl", "HDL", "HDL-C", "고밀도지단백", "HDL콜레스테롤"],
      ldl: ["ldl", "LDL", "LDL-C", "저밀도지단백", "LDL콜레스테롤"],
      freeT3: ["free_t3", "Free T3", "FT3", "자유T3"],
      freeT4: ["free_t4", "Free T4", "FT4", "자유T4"],
      tsh: ["tsh", "TSH", "갑상선자극호르몬", "Thyroid Stimulating Hormone"],
      homocysteine: ["homocysteine", "Hcy", "Homocysteine", "호모시스테인"],
      vitaminD: ["vitamin_d", "VitD", "Vitamin D3", "25-OH Vitamin D", "비타민D", "D3", "25(OH)D"],
      hgbA1c: ["hgba1c", "HbA1c", "당화혈색소", "Glycated Hemoglobin", "A1c"],
      scc: ["scc", "SCC", "편평상피세포암항원", "Squamous Cell Carcinoma Antigen"],
      cea: ["cea", "CEA", "Carcinoembryonic Antigen", "암태아항원"],
      ca199: ["ca199", "CA19-9", "Ca19-9", "췌담도암표지자", "Carbohydrate Antigen 19-9"],
      ca125: ["ca125", "CA125", "Ca125", "난소암표지자", "Cancer Antigen 125"],
      ca153: ["ca153", "CA15-3", "Ca153", "유방암표지자", "Cancer Antigen 15-3"],
      psa: ["psa", "PSA", "전립선특이항원", "Prostate Specific Antigen"],
      afp: ["afp", "AFP", "알파태아단백", "Alpha-Fetoprotein"],
      ca724: ["ca724", "CA72-4", "Ca724", "위암표지자", "Cancer Antigen 72-4"],
      nse: ["nse", "NSE", "Neuron Specific Enolase", "신경특이 에놀라제"],
      lmr: ["lmr", "LMR", "Lymphocyte/Monocyte Ratio", "림프구대단핵구비"],
      nlr: ["nlr", "NLR", "Neutrophil/Lymphocyte Ratio", "호중구대림프구비"],
      crp: ["crp", "CRP", "C-Reactive Protein", "C반응단백", "염증수치"],
      cholesterol: ["cholesterol", "TC", "총콜레스테롤", "Chol", "Total Cholesterol"],
      ldh: ["ldh", "LDH", "젖산탈수소효소", "Lactate Dehydrogenase"],
      testDate: ["testDate", "Test Date", "검사일자", "Test Date"],
    };

    // 🔹 1) Google Vision OCR
    const ocrRes = await fetch("https://vision.googleapis.com/v1/images:annotate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        requests: [
          {
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            image: {
              content: cleanedBase64,
            },
          },
        ],
      }),
    });
    if (!ocrRes.ok) {
      const errText = await ocrRes.text();
      console.error("Vision API error:", errText);
      throw new Error(`Vision API error: ${ocrRes.status}`);
    }

    const ocrJson = await ocrRes.json();
    const text: string = ocrJson?.responses?.[0]?.fullTextAnnotation?.text ?? "";

    // 🔹 2) OpenAI로 구조화
    const openai = new OpenAI({ apiKey: openaiKey });

    // variations 정보를 프롬프트에 포함
    const variationsText = Object.entries(metricVariations)
      .map(([key, variations]) => {
        const variationsList = variations.map((v) => `"${v}"`).join(", ");
        return `  "${key}": [${variationsList}]`;
      })
      .join(",\n");

    const prompt = `다음은 한국 병원에서 발급된 혈액검사 결과의 OCR 텍스트입니다.
가능한 경우 아래 JSON 형태로 수치를 채워주세요.
없거나 알 수 없는 값은 빈 문자열("")로 두세요.

각 검사 항목은 다양한 이름으로 표시될 수 있습니다. 아래 variations 목록을 참고하여 매칭해주세요:
{
${variationsText}
}

반드시 이 JSON 형식 그대로만 출력하세요:
{
  "wbc": "",
  "rbc": "",
  "hgb": "",
  "hct": "",
  "mcv": "",
  "mchc": "",
  "platelet": "",
  "rdw": "",
  "pdw": "",
  "neutrophil": "",
  "lymphocyte": "",
  "monocyte": "",
  "eosinophil": "",
  "basophil": "",
  "totalBilirubin": "",
  "ast": "",
  "alt": "",
  "gtp": "",
  "bun": "",
  "creatinine": "",
  "egfr": "",
  "uricAcid": "",
  "glucose": "",
  "triglyceride": "",
  "hdl": "",
  "ldl": "",
  "freeT3": "",
  "freeT4": "",
  "tsh": "",
  "homocysteine": "",
  "vitaminD": "",
  "hgbA1c": "",
  "scc": "",
  "cea": "",
  "ca199": "",
  "ca125": "",
  "ca153": "",
  "psa": "",
  "afp": "",
  "ca724": "",
  "nse": "",
  "lmr": "",
  "nlr": "",
  "crp": "",
  "cholesterol": "",
  "ldh": "",
  "testDate": ""
}

여기서 testDate는 yyyy-mm-dd 형식으로 맞춰주세요.
각 항목의 variations 목록에 있는 모든 이름 변형을 확인하여 정확하게 매칭해주세요.

OCR 텍스트:
${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "너는 한국 병원 혈액검사 결과지를 JSON으로 구조화하는 어시스턴트다. 반드시 유효한 JSON 형식만 반환해야 한다.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" }, // JSON 형식 강제
    });

    const reply = completion.choices[0]?.message?.content ?? "{}";

    let structured: Record<string, string>;
    try {
      structured = JSON.parse(reply);
    } catch (e) {
      console.error("Failed to parse OpenAI JSON:", e, reply);
      structured = {
        wbc: "",
        rbc: "",
        hgb: "",
        hct: "",
        mcv: "",
        mchc: "",
        platelet: "",
        rdw: "",
        pdw: "",
        neutrophil: "",
        lymphocyte: "",
        monocyte: "",
        eosinophil: "",
        basophil: "",
        totalBilirubin: "",
        ast: "",
        alt: "",
        gtp: "",
        bun: "",
        creatinine: "",
        egfr: "",
        uricAcid: "",
        glucose: "",
        triglyceride: "",
        hdl: "",
        ldl: "",
        freeT3: "",
        freeT4: "",
        tsh: "",
        homocysteine: "",
        vitaminD: "",
        hgbA1c: "",
        scc: "",
        cea: "",
        ca199: "",
        ca125: "",
        ca153: "",
        psa: "",
        afp: "",
        ca724: "",
        nse: "",
        lmr: "",
        nlr: "",
        crp: "",
        cholesterol: "",
        ldh: "",
        testDate: "",
      };
    }

    return new Response(JSON.stringify({ structured, rawText: text, cached: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OCR function error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
