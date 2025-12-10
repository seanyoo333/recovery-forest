import type { Route } from "./+types/medical-consent";

import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import path from "node:path";
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
  return [{ title: "의료정보 제공 동의서 | Evidence Base" }];
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
  const consent = formData.get("consent");

  if (consent !== "on") {
    return { error: "의료정보 제공에 동의해야 서비스를 이용할 수 있습니다." };
  }

  // 동의 완료 후 혈액검사 입력 페이지로 리다이렉트 (success 플래그 포함)
  return redirect("/my/dashboard/health/submit?consent=success");
};

export default function MedicalConsent({ loaderData: { frontmatter, code }, actionData }: Route.ComponentProps) {
  const MDXContent = getMDXComponent(code);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">의료정보 제공 동의서</h1>
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
            <p>혈액검사 결과를 입력하기 전에 의료정보 제공에 대한 동의가 필요합니다.</p>
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
            <div className="flex items-center space-x-2">
              <Checkbox id="consent" name="consent" required />
              <label
                htmlFor="consent"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                위 의료정보 제공 동의서의 내용을 충분히 이해하고, 의료정보 수집, 이용 및 제공에 동의합니다.
              </label>
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
