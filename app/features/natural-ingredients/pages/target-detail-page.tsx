import type { Route } from "./+types/target-detail-page";

import { z } from "zod";

import { Hero } from "~/core/components/hero";
import makeServerClient from "~/core/lib/supa-client.server";

import { IngredientCard } from "../components/ingredient-card";
import { PAGE_SIZE } from "../constants";
import { getIngredientsByTargetSlug } from "../queries";

export const meta: Route.MetaFunction = ({ params, data }) => {
  const name = data?.target?.display_name ?? params.targetSlug;
  return [
    { title: `${name} | 표적별 모음 | Evidence Base` },
    {
      name: "description",
      content: `${name} 표적과 연결된 천연물질(성분) 목록`,
    },
  ];
};

const paramsSchema = z.object({
  targetSlug: z.string().min(1),
});

export async function loader({
  request,
  params,
}: Route.LoaderArgs & { params: { targetSlug: string } }) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    throw new Response("Invalid target", { status: 400 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const [client] = makeServerClient(request);

  const { target, ingredients, totalPages } = await getIngredientsByTargetSlug(
    client,
    {
      targetSlug: parsed.data.targetSlug,
      page,
      limit: PAGE_SIZE,
    },
  );

  if (!target) {
    throw new Response("Not Found", { status: 404 });
  }

  return { target, ingredients, totalPages };
}

export default function TargetDetailPage({ loaderData }: Route.ComponentProps) {
  const { target, ingredients, totalPages } = loaderData;

  return (
    <div className="space-y-10">
      <Hero
        title={target.display_name}
        subtitle={target.description ?? undefined}
      />

      <div className="mx-auto w-full max-w-screen-md space-y-5">
        {ingredients.map((ingredient) => (
          <IngredientCard
            key={ingredient.id}
            slug={ingredient.slug}
            name={ingredient.display_name}
            description={ingredient.tagline ?? ingredient.display_name}
            picture={ingredient.picture}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}`}
              className="hover:bg-muted rounded border px-3 py-1 text-sm"
            >
              {p}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
