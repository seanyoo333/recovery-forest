import type { Route } from "./+types/product-overview-page";

import { useOutletContext } from "react-router";

import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  // 먼저 제품 정보를 조회
  const { error, data } = await adminClient
    .from("products")
    .select("product_id")
    .eq("product_id", params.productId)
    .single();

  if (data) {
    // 현재 로그인한 사용자 정보 가져오기
    const [client] = makeServerClient(request);
    const {
      data: { user },
    } = await client.auth.getUser();

    // 제품이 존재하는 경우에만 트리거 실행
    await adminClient.rpc("track_event", {
      event_type: "product_view",
      event_data: {
        product_id: params.productId,
      },
      profile_id: user?.id || null,
    });
  }

  return null;
};

export default function ProductOverviewPage() {
  const { description, how_it_works } = useOutletContext<{
    description: string;
    how_it_works: string;
  }>();
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h3 className="text-lg font-bold">What is this product?</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold">How does it work?</h3>
        <p className="text-muted-foreground">{how_it_works}</p>
      </div>
    </div>
  );
}
