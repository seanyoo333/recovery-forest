import type { Route } from "./+types/admin-product-detail";

import { redirect } from "react-router";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "제품 상세 - 관리자 | Evidence Base" },
    { name: "description", content: "제품 상세 정보 및 통계" },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  // 제품 정보 가져오기
  const { data: product, error } = await client
    .from("products")
    .select("product_id, name, tagline, description, stats")
    .eq("product_id", params.productId)
    .single();

  if (error || !product) {
    throw redirect("/my/admin-dashboard");
  }

  // 제품 통계 데이터 가져오기
  const { data: statsData, error: rpcError } = await client.rpc(
    "get_product_stats",
    {
      product_id: params.productId,
    },
  );

  if (rpcError) {
    console.error("Error fetching product stats:", rpcError);
  }

  return {
    product,
    chartData: statsData || [],
  };
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
}: Route.ComponentProps) {
  const { product, chartData } = loaderData;

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

      {/* 제품 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>제품 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">설명</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
