import type { Route } from "./+types/admin-product-chart";

import { Area, AreaChart } from "recharts";
import { CartesianGrid, XAxis } from "recharts";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";
import type { ChartConfig } from "~/core/components/ui/chart";
import { ChartTooltipContent } from "~/core/components/ui/chart";
import { ChartTooltip } from "~/core/components/ui/chart";
import { ChartContainer } from "~/core/components/ui/chart";
import makeServerClient from "~/core/lib/supa-client.server";

import { requireAdminRole, requireAuthentication } from "../guards.server";
import { getWeeklyEventStats } from "../queries";
import { getAllProductsForAdmin } from "~/features/products/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "제품 차트 | 관리자 | Evidence Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  const weeklyStats = await getWeeklyEventStats(client);
  const products = await getAllProductsForAdmin(client);

  return {
    chartData: weeklyStats,
    products,
  };
};

const chartConfig = {
  product_view: {
    label: "Product Views",
    color: "hsl(var(--primary))",
  },
  product_visit: {
    label: "Product Visits",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

export default function AdminProductChartPage({
  loaderData,
}: Route.ComponentProps) {
  const { chartData, products } = loaderData;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">제품 관리</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            등록된 제품을 확인하고 수정할 수 있습니다.
          </p>
        </div>
        <Button asChild>
          <Link to="/products/submit">새 제품 등록</Link>
        </Button>
      </div>

      {/* 제품 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle>제품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">이름</th>
                    <th className="px-3 py-2">태그라인</th>
                    <th className="px-3 py-2">카테고리</th>
                    <th className="px-3 py-2">등록일</th>
                    <th className="px-3 py-2 text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product.product_id} className="border-b">
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {product.product_id}
                      </td>
                      <td className="px-3 py-2 font-medium">{product.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {product.tagline}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {product.category_id ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="xs" variant="outline">
                            <Link
                              to={`/products/${product.product_id}/overview`}
                            >
                              공개 페이지
                            </Link>
                          </Button>
                          <Button asChild size="xs">
                            <Link
                              to={`/my/admin-dashboard/products/${product.product_id}`}
                            >
                              수정
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              등록된 제품이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 간단한 주간 통계 차트 */}
      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>Weekly Event Statistics</CardTitle>
          {chartData && chartData.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              최근 {chartData.length}주간 데이터
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">데이터가 없습니다</p>
          )}
        </CardHeader>
        <CardContent>
          {chartData && chartData.length > 0 ? (
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  padding={{ left: 15, right: 15 }}
                  angle={0}
                  textAnchor="end"
                  height={60}
                />
                <Area
                  dataKey="product_view"
                  type="natural"
                  stroke="var(--color-product_view)"
                  fill="var(--color-product_view)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  dataKey="product_visit"
                  type="natural"
                  stroke="var(--color-product_visit)"
                  fill="var(--color-product_visit)"
                  strokeWidth={2}
                  dot={false}
                />
                <ChartTooltip
                  cursor={false}
                  wrapperStyle={{ minWidth: "200px" }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="text-muted-foreground flex h-80 items-center justify-center">
              표시할 데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
