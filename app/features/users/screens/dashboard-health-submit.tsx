import type { Route } from ".react-router/types/app/features/users/screens/+types/dashboard-health-submit";

import { useState } from "react";
import { Form, redirect, useSearchParams } from "react-router";
import { z } from "zod";

import InputPair from "~/core/components/input-pair";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

export const meta: Route.MetaFunction = () => {
  return [{ title: "혈액검사 수치 입력 | Evidence Base" }];
};

const bloodTestSchema = z.object({
  lmr: z.string().min(1, "LMR 수치를 입력해주세요"),
  nlr: z.string().min(1, "NLR 수치를 입력해주세요"),
  platelet: z.string().min(1, "Platelet 수치를 입력해주세요"),
  crp: z.string().min(1, "CRP 수치를 입력해주세요"),
  glucose: z.string().min(1, "Glucose 수치를 입력해주세요"),
  hgbA1c: z.string().min(1, "HgbA1c 수치를 입력해주세요"),
  cholesterol: z.string().min(1, "Cholesterol 수치를 입력해주세요"),
  ldh: z.string().min(1, "LDH 수치를 입력해주세요"),
  ast: z.string().min(1, "AST 수치를 입력해주세요"),
  alt: z.string().min(1, "ALT 수치를 입력해주세요"),
  egfr: z.string().min(1, "eGFR 수치를 입력해주세요"),
  vitaminD3: z.string().min(1, "Vitamin D3 수치를 입력해주세요"),
  tumorMarker: z.string().min(1, "Tumor Marker 수치를 입력해주세요"),
  testDate: z.string().min(1, "검사 날짜를 입력해주세요"),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const { success, error, data } = bloodTestSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!success) {
    return { fieldErrors: error.flatten().fieldErrors };
  }

  // TODO: 실제 데이터베이스에 저장하는 로직 구현
  console.log("혈액검사 데이터:", data);

  return redirect("/my/dashboard/health");
};

export default function DashboardHealthSubmit({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const hasConsent = searchParams.get("consent") === "success";

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);

    // TODO: Google OCR API 호출 로직 구현
    // 실제 구현에서는 Google Cloud Vision API를 사용
    setTimeout(() => {
      setIsOcrProcessing(false);
      // OCR 결과를 폼에 자동 입력하는 로직
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">혈액검사 수치 입력</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          뒤로가기
        </Button>
      </div>

      {/* 동의 확인 메시지는 동의 페이지에서 온 경우에만 표시 */}
      {hasConsent && (
        <Card>
          <CardHeader>
            <CardTitle>의료정보 제공 동의 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>✅ 의료정보 제공에 동의하셨습니다.</p>
              <p>이제 혈액검사 결과를 안전하게 입력할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>검사 결과 사진 업로드 (OCR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
                disabled={isOcrProcessing}
              />
              {isOcrProcessing && (
                <div className="text-muted-foreground text-sm">
                  OCR 처리 중...
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              혈액검사 결과 사진을 업로드하면 자동으로 수치를 인식합니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Form method="post" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>수동 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputPair
                label="LMR"
                name="lmr"
                description="림프구 대 단핵구 비율"
                type="number"
                step="0.01"
                placeholder="예: 2.5"
                required
              />
              <InputPair
                label="NLR"
                name="nlr"
                description="호중구 대 림프구 비율"
                type="number"
                step="0.01"
                placeholder="예: 1.8"
                required
              />
              <InputPair
                label="Platelet"
                name="platelet"
                description="혈소판 수"
                type="number"
                placeholder="예: 250"
                required
              />
              <InputPair
                label="CRP"
                name="crp"
                description="C-반응성 단백질"
                type="number"
                step="0.01"
                placeholder="예: 0.5"
                required
              />
              <InputPair
                label="Glucose"
                name="glucose"
                description="혈당 수치"
                type="number"
                placeholder="예: 95"
                required
              />
              <InputPair
                label="HgbA1c"
                name="hgbA1c"
                description="당화혈색소"
                type="number"
                step="0.1"
                placeholder="예: 5.7"
                required
              />
              <InputPair
                label="Cholesterol"
                name="cholesterol"
                description="총 콜레스테롤"
                type="number"
                placeholder="예: 180"
                required
              />
              <InputPair
                label="LDH"
                name="ldh"
                description="젖산탈수소효소"
                type="number"
                placeholder="예: 140"
                required
              />
              <InputPair
                label="AST"
                name="ast"
                description="아스파르테이트 아미노전이효소"
                type="number"
                placeholder="예: 25"
                required
              />
              <InputPair
                label="ALT"
                name="alt"
                description="알라닌 아미노전이효소"
                type="number"
                placeholder="예: 30"
                required
              />
              <InputPair
                label="eGFR"
                name="egfr"
                description="추정 사구체 여과율"
                type="number"
                placeholder="예: 90"
                required
              />
              <InputPair
                label="Vitamin D3"
                name="vitaminD3"
                description="비타민 D3 수치"
                type="number"
                step="0.1"
                placeholder="예: 25.0"
                required
              />
              <InputPair
                label="Tumor Marker"
                name="tumorMarker"
                description="종양 표지자"
                type="number"
                step="0.01"
                placeholder="예: 2.5"
                required
              />
            </div>

            <InputPair
              label="검사 날짜"
              name="testDate"
              description="혈액검사를 받은 날짜"
              type="date"
              required
            />
          </CardContent>
        </Card>

        {actionData &&
          typeof actionData === "object" &&
          actionData !== null &&
          "fieldErrors" in actionData && (
            <div className="space-y-2 text-red-500">
              {Object.entries((actionData as any).fieldErrors || {}).map(
                ([field, errors]: [string, any]) => (
                  <div key={field}>
                    {field}:{" "}
                    {Array.isArray(errors) ? errors.join(", ") : String(errors)}
                  </div>
                ),
              )}
            </div>
          )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            취소
          </Button>
          <Button type="submit">저장하기</Button>
        </div>
      </Form>
    </div>
  );
}
