import type { Route } from "./+types/product-visit-page";

import { redirect } from "react-router";

import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { error, data } = await adminClient
    .from("products")
    .select("url")
    .eq("product_id", Number(params.productId))
    .single();
  if (data) {
    // 현재 로그인한 사용자 정보 가져오기
    const [client] = makeServerClient(request);
    const {
      data: { user },
    } = await client.auth.getUser();

    await adminClient.rpc("track_event", {
      event_type: "product_visit",
      event_data: {
        product_id: params.productId,
      },
      profile_id: user?.id as string,
    });
    return redirect(data.url);
  }
};
