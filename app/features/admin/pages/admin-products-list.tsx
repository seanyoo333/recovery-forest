import type { Route } from "../../users/screens/+types/admin-products-list";

import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
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
    { title: "제품 관리 - 관리자 | Evidence Base" },
    { name: "description", content: "제품 관리 및 통계" },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  // 모든 제품 정보 가져오기
  const { data: products, error } = await client
    .from("products")
    .select("product_id, name, tagline, description, stats, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return { products: [] };
  }

  return { products: products || [] };
};

export default function AdminProductsListPage({
  loaderData,
}: Route.ComponentProps) {
  const { products } = loaderData;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">제품 관리</h1>
          <p className="text-muted-foreground mt-2">
            등록된 제품 목록 및 통계 확인
          </p>
        </div>
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
          <Link to="/products/submit">+ 새 제품 등록</Link>
        </Button>
      </div>

      {/* 제품 목록 */}
      <div className="grid gap-4">
        {products.map((product) => (
          <Card
            key={product.product_id}
            className="transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {product.tagline}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-muted-foreground text-sm">조회수</div>
                    <div className="font-semibold">
                      {product.stats?.views || 0}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground text-sm">리뷰</div>
                    <div className="font-semibold">
                      {product.stats?.reviews || 0}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground text-sm">업보트</div>
                    <div className="font-semibold">
                      {product.stats?.upvotes || 0}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {product.description}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to={`/my/admin-dashboard/products/${product.product_id}`}
                  >
                    상세 보기
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                등록된 제품이 없습니다.
              </p>
              <Button
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link to="/products/submit">+ 첫 번째 제품 등록하기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
