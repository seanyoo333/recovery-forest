import type { Route } from "./+types/category-page";

import { z } from "zod";

import { Hero } from "~/core/components/hero";
import ProductPagination from "~/core/components/product-pagination";
import makeServerClient from "~/core/lib/supa-client.server";
import { ProductCard } from "~/features/products/components/product-card";
import {
  getCategory,
  getCategoryPages,
  getProductsByCategory,
} from "~/features/products/queries";
import { getProductStats } from "~/features/products/utils/product-stats";

export const meta = ({ params }: Route.MetaArgs) => {
  return [
    { title: `Category | Evidence Base` },
    { name: "description", content: `Browse natural products by category` },
  ];
};

const paramsSchema = z.object({
  category: z.coerce.number(),
});

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || 1;
  const { data, success } = paramsSchema.safeParse(params);
  if (!success) {
    throw new Response("Invalid category", { status: 400 });
  }
  const [client, headers] = makeServerClient(request);
  const category = await getCategory(client, { categoryId: data.category });
  const products = await getProductsByCategory(client, {
    categoryId: data.category,
    page: Number(page),
  });
  const totalPages = await getCategoryPages(client, {
    categoryId: data.category,
  });
  return { category, products, totalPages };
};

function formatAcademicName(value?: string | null) {
  if (!value) return undefined;
  return value
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const { category, products, totalPages } = loaderData;
  const academicLabel = formatAcademicName(category?.academic_name);
  const targetLabel = formatAcademicName(category?.target);

  return (
    <div className="space-y-10">
      <Hero
        title={"천연성분 보조제"}
        subtitle={`최고 수준의 천연성분 보조제를 소개합니다`}
      />

      <div className="mx-auto w-full max-w-screen-md space-y-5">
        {loaderData.products.map((product) => {
          const stats = getProductStats(product.stats);
          return (
            <ProductCard
              key={product.product_id}
              id={product.product_id}
              name={product.name}
              description={product.tagline}
              reviewsCount={stats.reviews}
              viewsCount={stats.views}
              votesCount={stats.upvotes}
              isUpvoted={stats.is_upvoted}
              promotedFrom={product.promoted_from}
            />
          );
        })}
      </div>
      <ProductPagination totalPages={loaderData.totalPages} />
    </div>
  );
}
