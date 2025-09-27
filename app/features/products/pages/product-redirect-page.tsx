import type { Route } from "./+types/product-redirect-page";

import { redirect } from "react-router";

export const loader = ({ params }: Route.LoaderArgs) => {
  // 제품 ID를 받아서 제품 상세 페이지로 리다이렉트
  return redirect(`/products/${params.productId}/overview`);
};
