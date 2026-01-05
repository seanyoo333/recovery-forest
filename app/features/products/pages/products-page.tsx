import type { Route } from "./+types/products-page";

import { Hero } from "~/core/components/hero";
import ProductPagination from "~/core/components/product-pagination";
import makeServerClient from "~/core/lib/supa-client.server";

import { ProductCard } from "../components/product-card";
import { PAGE_SIZE } from "../constants";
import {
  getProductPagesByPopularity,
  getProductsByPopularity,
} from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "천연물질 | Evidence Base" },
    {
      name: "description",
      content: "전체 천연물질(Natural Products)을 추천 순위로 확인하세요",
    },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const [client, headers] = makeServerClient(request);

  const products = await getProductsByPopularity(client, {
    limit: PAGE_SIZE,
    page,
  });

  const totalPages = await getProductPagesByPopularity(client);

  return { products, totalPages };
};

export default function ProductsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-10">
      <Hero
        title="전체 천연물질"
        subtitle="등록된 모든 천연물질(Natural Products)을 추천 순위로 확인하세요"
      />

      <div className="mx-auto w-full max-w-screen-md space-y-5">
        {loaderData.products.map((product) => {
          return (
            <ProductCard
              key={product.product_id}
              id={product.product_id}
              name={product.name}
              description={product.tagline}
              reviewsCount={product.reviews}
              viewsCount={product.views}
              votesCount={product.upvotes}
              isUpvoted={product.is_upvoted ?? false}
              promotedFrom={product.promoted_from}
            />
          );
        })}
      </div>

      {loaderData.totalPages > 1 && (
        <ProductPagination totalPages={loaderData.totalPages} />
      )}
    </div>
  );
}
