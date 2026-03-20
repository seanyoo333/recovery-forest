import type { Route } from "./+types/ingredients-index-page";

import { Hero } from "~/core/components/hero";
import makeServerClient from "~/core/lib/supa-client.server";

import { IngredientCard } from "../components/ingredient-card";
import { PAGE_SIZE } from "../constants";
import { getIngredientPages, getIngredients } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "전체 천연물질 | Evidence Base" },
    {
      name: "description",
      content:
        "등록된 모든 천연물질(성분) 정보와 표적별 근거 자료를 확인하세요",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const [client] = makeServerClient(request);

  const ingredients = await getIngredients(client, {
    limit: PAGE_SIZE,
    page,
  });
  const totalPages = await getIngredientPages(client);

  return { ingredients, totalPages };
}

export default function IngredientsIndexPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-10">
      <Hero
        title="전체 천연물질"
        subtitle="등록된 모든 천연물질(성분) 정보와 표적별 근거 자료를 확인하세요"
      />

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
      </div>

      {loaderData.totalPages > 1 && (
        <nav className="flex justify-center gap-2">
          {Array.from({ length: loaderData.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <a
                key={p}
                href={`?page=${p}`}
                className="hover:bg-muted rounded border px-3 py-1 text-sm"
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
