import type { Route } from "./+types/medical-consent";

import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import path from "node:path";
import { useState } from "react";
import { Form, Link, data, redirect } from "react-router";

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyList,
  TypographyOrderedList,
  TypographyP,
} from "~/core/components/mdx-typography1";
import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";

export const meta: Route.MetaFunction = () => {
  return [{ title: "건강정보 및 서비스 이용 동의 | Evidence Base" }];
};

export async function loader() {
  const filePath = path.join(process.cwd(), "app", "features", "legal", "docs", "medical-consent.mdx");

  try {
    const { code, frontmatter } = await bundleMDX({
      file: filePath,
    });

    return {
      frontmatter,
      code,
    };
  } catch (error) {
    throw data(null, { status: 500 });
  }
}

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const sensitive = formData.get("sensitive");
  const overseas = formData.get("overseas");
  const aiNotice = formData.get("aiNotice");
  const medicalDisclaimer = formData.get("medicalDisclaimer");

  if (sensitive !== "on" || overseas !== "on" || aiNotice !== "on" || medicalDisclaimer !== "on") {
    return { error: "모든 필수 항목에 동의해 주세요." };
  }

  // 동의 완료 후 혈액검사 입력 페이지로 리다이렉트 (success 플래그 포함)
  return redirect("/my/dashboard/health/submit?consent=success");
};

export default function MedicalConsent({ loaderData: { frontmatter, code }, actionData }: Route.ComponentProps) {
  const MDXContent = getMDXComponent(code);
  const [sensitive, setSensitive] = useState(false);
  const [overseas, setOverseas] = useState(false);
  const [aiNotice, setAiNotice] = useState(false);
  const [medicalDisclaimer, setMedicalDisclaimer] = useState(false);

  const allChecked = sensitive && overseas && aiNotice && medicalDisclaimer;
  const handleAgreeAll = (checked: boolean) => {
    setSensitive(checked);
    setOverseas(checked);
    setAiNotice(checked);
    setMedicalDisclaimer(checked);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">건강정보 및 서비스 이용 동의</h1>
        <Button variant="outline" asChild>
          <Link to="/my/dashboard/health">뒤로가기</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>중요 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground space-y-4 text-sm">
            <p>맞춤형 건강 리포트 및 건강관리 보조 서비스를 이용하기 전에 건강정보 제공에 대한 동의가 필요합니다.</p>
            <p>아래 동의서를 자세히 읽고 동의 여부를 선택해주세요.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <MDXContent
            components={{
              h1: TypographyH1,
              h2: TypographyH2,
              h3: TypographyH3,
              h4: TypographyH4,
              p: TypographyP,
              blockquote: TypographyBlockquote,
              ul: TypographyList,
              ol: TypographyOrderedList,
              code: TypographyInlineCode,
            }}
          />
        </CardContent>
      </Card>

      <Form method="post">
        <Card>
          <CardHeader>
            <CardTitle>동의 여부</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                <Checkbox
                  id="agreeAll"
                  checked={allChecked}
                  onCheckedChange={(v) => handleAgreeAll(!!v)}
                  className="mt-0.5"
                />
                <label htmlFor="agreeAll" className="cursor-pointer text-sm font-medium leading-relaxed">
                  전체 동의
                </label>
              </div>
              <div className="space-y-3">
                {sensitive && <input type="hidden" name="sensitive" value="on" />}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="sensitive"
                    checked={sensitive}
                    onCheckedChange={(v) => setSensitive(!!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="sensitive" className="cursor-pointer text-sm leading-relaxed">
                    [필수] 건강정보(민감정보) 수집·이용에 동의합니다.
                  </label>
                </div>
                {overseas && <input type="hidden" name="overseas" value="on" />}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="overseas"
                    checked={overseas}
                    onCheckedChange={(v) => setOverseas(!!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="overseas" className="cursor-pointer text-sm leading-relaxed">
                    [필수] 개인정보의 국외 이전에 동의합니다.
                  </label>
                </div>
                {aiNotice && <input type="hidden" name="aiNotice" value="on" />}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="aiNotice"
                    checked={aiNotice}
                    onCheckedChange={(v) => setAiNotice(!!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="aiNotice" className="cursor-pointer text-sm leading-relaxed">
                    [필수] AI 분석 및 자동화된 처리 안내를 확인했습니다.
                  </label>
                </div>
                {medicalDisclaimer && <input type="hidden" name="medicalDisclaimer" value="on" />}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="medicalDisclaimer"
                    checked={medicalDisclaimer}
                    onCheckedChange={(v) => setMedicalDisclaimer(!!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="medicalDisclaimer" className="cursor-pointer text-sm leading-relaxed">
                    [필수] 본 서비스는 의료행위가 아니며, 진단·처방을 대체하지 않음을 이해했습니다.
                  </label>
                </div>
              </div>
            </div>

            {actionData && "error" in actionData && <div className="text-sm text-red-500">{actionData.error}</div>}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link to="/my/dashboard/health">동의하지 않음</Link>
              </Button>
              <Button type="submit">동의하고 계속하기</Button>
            </div>
          </CardContent>
        </Card>
      </Form>
    </div>
  );
}
