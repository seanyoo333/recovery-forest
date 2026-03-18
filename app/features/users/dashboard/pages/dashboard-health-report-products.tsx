/**
 * Health Report Products Page - 구매 가능한 건강 보고서 상품 목록
 *
 * 상품 카드를 클릭하면 해당 상품의 요청 목록 페이지로 이동합니다.
 * 향후 상품 추가 시 HEALTH_REPORT_PRODUCTS에 추가하면 됩니다.
 */
import type { Route } from "./+types/dashboard-health-report-products";

import { ChevronRight, FileText } from "lucide-react";
import { Link } from "react-router";

import {
  HEALTH_REPORT_PRODUCTS,
  getHealthReportProductPath,
  type HealthReportProduct,
} from "~/core/lib/health-report";
import { getCheckoutUrl } from "~/core/lib/payment-constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "건강 보고서 | Dashboard" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  if (!userId) {
    throw new Response(null, { status: 401 });
  }
  return {};
}

function ProductCard({ product }: { product: HealthReportProduct }) {
  const toPath = getHealthReportProductPath(product.id);

  return (
    <Link to={toPath} viewTransition>
      <Card className="group flex h-full cursor-pointer flex-col transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <CardDescription className="line-clamp-2">
              {product.description}
            </CardDescription>
          </div>
          <ChevronRight className="text-muted-foreground size-5 shrink-0 transition-transform group-hover:translate-x-1" />
        </CardHeader>
        <CardContent className="mt-auto pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {product.price.toLocaleString()}원
            </span>
            <span className="text-muted-foreground text-sm">
              요청 내역 보기 →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardHealthReportProductsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-bold">맞춤 건강 보고서</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          구매 가능한 건강 보고서 상품을 선택하여 요청 내역을 확인하세요.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HEALTH_REPORT_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* 포인트 충전/카드 결제 안내 */}
      <Card className="bg-muted/20">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-muted-foreground size-8 shrink-0" />
            <div>
              <p className="font-medium">포인트 충전 또는 카드 결제</p>
              <p className="text-muted-foreground text-sm">
                리포트 요청 시 포인트를 사용합니다. 포인트가 부족하면 충전하거나
                카드로 결제할 수 있습니다.
              </p>
            </div>
          </div>
          <Link
            to={getCheckoutUrl("point")}
            viewTransition
            className="shrink-0 font-medium text-primary hover:underline"
          >
            포인트 충전 →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
