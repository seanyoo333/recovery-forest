import type { Route } from "./+types/admin-product-detail";

import { Form, redirect } from "react-router";
import z from "zod";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";
import { updateProduct } from "~/features/products/mutations";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "제품 상세 - 관리자 | Evidence Base" },
    { name: "description", content: "제품 상세 정보 및 통계" },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  // 제품 정보 가져오기
  const { data: product, error } = await client
    .from("products")
    .select(
      "product_id, name, tagline, description, how_it_works, url, category_id, stats",
    )
    .eq("product_id", Number(params.productId))
    .single();

  if (error || !product) {
    throw redirect("/my/admin-dashboard");
  }

  // 제품 통계 데이터 가져오기
  const { data: statsData, error: rpcError } = await client.rpc(
    "get_product_stats",
    {
      product_id: Number(params.productId),
    },
  );

  if (rpcError) {
    console.error("Error fetching product stats:", rpcError);
  }

  return {
    product,
    chartData: statsData || [],
    formErrors: null,
  };
};

const formSchema = z.object({
  name: z.string().min(1, "제품 이름을 입력해 주세요."),
  tagline: z.string().min(1, "태그라인을 입력해 주세요."),
  description: z.string().min(1, "설명을 입력해 주세요."),
  how_it_works: z.string().min(1, "동작 방식을 입력해 주세요."),
  url: z.string().url("올바른 URL 형식이 아닙니다."),
  category_id: z.coerce.number().int().positive("카테고리를 선택해 주세요."),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  const formData = await request.formData();
  const parseResult = formSchema.safeParse(Object.fromEntries(formData));

  if (!parseResult.success) {
    const { fieldErrors } = parseResult.error.flatten();

    // 기존 제품 정보는 그대로 다시 로드
    const { data: product } = await client
      .from("products")
      .select(
        "product_id, name, tagline, description, how_it_works, url, category_id, stats",
      )
      .eq("product_id", Number(params.productId))
      .single();

    return {
      product,
      chartData: [],
      formErrors: fieldErrors,
    };
  }

  const data = parseResult.data;

  await updateProduct(client, {
    productId: Number(params.productId),
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    howItWorks: data.how_it_works,
    url: data.url,
    categoryId: data.category_id,
  });

  return redirect(`/my/admin-dashboard/products/${params.productId}`);
};

// 차트 설정
const chartConfig = {
  product_views: {
    label: "페이지 조회수",
    color: "hsl(var(--primary))",
  },
  product_visits: {
    label: "외부 링크 방문수",
    color: "hsl(var(--chart-3))",
  },
};

// 월별 데이터 생성 (실제 데이터가 없을 경우)
function generateYearlyData() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return months.map((month) => ({
    product_views: Math.floor(Math.random() * 150) + 50,
    product_visits: Math.floor(Math.random() * 100) + 30,
    month,
  }));
}

export default function AdminProductDetailPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const data = (actionData || loaderData) as typeof loaderData & {
    formErrors?: Record<string, string[] | undefined> | null;
  };

  const { product, chartData, formErrors } = data;

  // 실제 데이터가 있으면 사용, 없으면 샘플 데이터 생성
  const displayData = chartData.length > 0 ? chartData : generateYearlyData();

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-2">{product.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-sm">
            제품 ID: {product.product_id}
          </p>
        </div>
      </div>

      {/* 제품 기본 정보 수정 */}
      <Card>
        <CardHeader>
          <CardTitle>제품 정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">제품 이름</Label>
                <Input id="name" name="name" defaultValue={product.name} />
                {formErrors?.name && (
                  <p className="text-xs text-red-500">
                    {formErrors.name.join(", ")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">태그라인</Label>
                <Input
                  id="tagline"
                  name="tagline"
                  defaultValue={product.tagline}
                />
                {formErrors?.tagline && (
                  <p className="text-xs text-red-500">
                    {formErrors.tagline.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={product.description}
              />
              {formErrors?.description && (
                <p className="text-xs text-red-500">
                  {formErrors.description.join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="how_it_works">동작 방식 (How it works)</Label>
              <Textarea
                id="how_it_works"
                name="how_it_works"
                rows={4}
                defaultValue={product.how_it_works ?? ""}
              />
              {formErrors?.how_it_works && (
                <p className="text-xs text-red-500">
                  {formErrors.how_it_works.join(", ")}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="url">제품 URL</Label>
                <Input id="url" name="url" defaultValue={product.url ?? ""} />
                {formErrors?.url && (
                  <p className="text-xs text-red-500">
                    {formErrors.url.join(", ")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">카테고리 ID</Label>
                <Input
                  id="category_id"
                  name="category_id"
                  defaultValue={product.category_id ?? ""}
                />
                {formErrors?.category_id && (
                  <p className="text-xs text-red-500">
                    {formErrors.category_id.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="submit">저장하기</Button>
            </div>
          </Form>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {product.stats?.views || 0}
              </div>
              <div className="text-muted-foreground text-sm">총 조회수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {product.stats?.reviews || 0}
              </div>
              <div className="text-muted-foreground text-sm">총 리뷰수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {product.stats?.upvotes || 0}
              </div>
              <div className="text-muted-foreground text-sm">총 업보트</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 월별 통계 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 통계</CardTitle>
          <p className="text-muted-foreground text-sm">
            제품 조회수와 외부 링크 방문수 추이
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {/* 차트 컴포넌트는 별도로 구현 필요 */}
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-lg font-semibold">통계 차트</div>
                <div className="text-muted-foreground text-sm">
                  {chartData.length > 0 ? (
                    <span>실제 데이터: {chartData.length}개월</span>
                  ) : (
                    <span>샘플 데이터 (실제 데이터 없음)</span>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {displayData.slice(0, 6).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.month}:</span>
                      <span>
                        조회 {item.product_views}, 방문 {item.product_visits}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
