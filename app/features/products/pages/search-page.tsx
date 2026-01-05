import type { Route } from "./+types/search-page";

import { useEffect, useRef } from "react";
import { Form, useSearchParams } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import ProductPagination from "~/core/components/product-pagination";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import makeServerClient from "~/core/lib/supa-client.server";

import { ProductCard } from "../components/product-card";
import { getPagesBySearch, getProductBySearch } from "../queries";
import { getProductStats } from "../utils/product-stats";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Search Natural Products | Evidence Base" },
    { name: "description", content: "Search for natural products" },
  ];
};

const searchParams = z.object({
  query: z.string().optional().default(""),
  page: z.coerce.number().optional().default(1),
});

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParams.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!success) {
    throw new Error("Invalid params");
  }
  if (parsedData.query === "") {
    return { products: [], totalPages: 1 };
  }
  const [client, headers] = makeServerClient(request);
  const products = await getProductBySearch(client, {
    query: parsedData.query,
    page: parsedData.page,
  });
  const totalPages = await getPagesBySearch(client, {
    query: parsedData.query,
  });

  return { products, totalPages };
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색 후 입력창 초기화
  useEffect(() => {
    if (query && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [query]);

  return (
    <div className="space-y-10">
      <Hero
        title="검색"
        subtitle="생각나는 키워드로 천연물질(Natural Products)을 검색하세요"
      />
      <Form className="mx-auto flex h-14 max-w-screen-sm items-center justify-center gap-2">
        <Input
          ref={inputRef}
          name="query"
          placeholder="Search for natural products"
          className="text-lg"
        />
        <Button type="submit">검색하기</Button>
      </Form>
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
        {query && loaderData.products.length === 0 && (
          <div className="col-span-full">
            <p className="text-muted-foreground text-center font-semibold">
              "{query}"에 대한 검색 결과가 없습니다.
            </p>
          </div>
        )}
      </div>
      {loaderData.products.length > 0 && (
        <ProductPagination totalPages={loaderData.totalPages} />
      )}
    </div>
  );
}
