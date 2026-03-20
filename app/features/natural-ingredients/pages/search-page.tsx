import type { Route } from "./+types/search-page";

import { useEffect, useRef } from "react";
import { Form, useSearchParams } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import makeServerClient from "~/core/lib/supa-client.server";

import { IngredientCard } from "../components/ingredient-card";
import { searchIngredients } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "천연물질 검색 | Evidence Base" },
    {
      name: "description",
      content: "천연물질(성분)을 검색하세요. 표시명, 동의어, 설명, 기전 등",
    },
  ];
};

const searchParamsSchema = z.object({
  query: z.string().optional().default(""),
  page: z.coerce.number().optional().default(1),
});

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  const { query, page } = parsed.success ? parsed.data : { query: "", page: 1 };

  if (query === "") {
    return { ingredients: [], totalPages: 1 };
  }

  const [client] = makeServerClient(request);
  const { ingredients, totalPages } = await searchIngredients(client, {
    query,
    page,
  });

  return { ingredients, totalPages };
}

export default function NaturalIngredientsSearchPage({
  loaderData,
}: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query && inputRef.current) {
      inputRef.current.value = query;
    }
  }, [query]);

  return (
    <div className="space-y-10">
      <Hero
        title="검색"
        subtitle="생각나는 키워드로 천연물질(성분)을 검색하세요"
      />

      <Form className="mx-auto flex h-14 max-w-screen-sm items-center justify-center gap-2">
        <Input
          ref={inputRef}
          name="query"
          placeholder="성분명, 동의어, 설명 등으로 검색"
          className="text-lg"
        />
        <Button type="submit">검색하기</Button>
      </Form>

      <div className="mx-auto w-full max-w-screen-md space-y-5">
        {loaderData.ingredients.map((ingredient) => (
          <IngredientCard
            key={ingredient.id}
            slug={ingredient.slug}
            name={ingredient.display_name}
            description={ingredient.tagline ?? ingredient.display_name}
            picture={ingredient.picture}
          />
        ))}
        {query && loaderData.ingredients.length === 0 && (
          <p className="text-muted-foreground text-center font-semibold">
            &quot;{query}&quot;에 대한 검색 결과가 없습니다.
          </p>
        )}
      </div>

      {loaderData.ingredients.length > 0 && loaderData.totalPages > 1 && (
        <nav className="flex justify-center gap-2">
          {Array.from({ length: loaderData.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <a
                key={p}
                href={`?query=${encodeURIComponent(query)}&page=${p}`}
                className="rounded border px-3 py-1 text-sm hover:bg-muted"
              >
                {p}
              </a>
            ),
          )}
        </nav>
      )}
    </div>
  );
}
