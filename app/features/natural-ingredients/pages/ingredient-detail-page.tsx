import type { Route } from "./+types/ingredient-detail-page";

import { Hero } from "~/core/components/hero";
import makeServerClient from "~/core/lib/supa-client.server";

import { getIngredientBySlug } from "../queries";

export const meta: Route.MetaFunction = ({ params, data }) => {
  const name = data?.ingredient?.display_name ?? params.slug;
  return [
    { title: `${name} | 천연물질 | Evidence Base` },
    {
      name: "description",
      content:
        data?.ingredient?.tagline ?? `${name} 성분의 정보와 근거 자료를 확인하세요`,
    },
  ];
};

export async function loader({
  request,
  params,
}: Route.LoaderArgs & { params: { slug: string } }) {
  const [client] = makeServerClient(request);
  const ingredient = await getIngredientBySlug(client, { slug: params.slug });

  if (!ingredient) {
    throw new Response("Not Found", { status: 404 });
  }

  return { ingredient };
}

export default function IngredientDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { ingredient } = loaderData;
  const desc = ingredient.description ?? ingredient.tagline ?? "";
  const mechanism = ingredient.mechanism ?? "";
  const safetyNotes = ingredient.safety_notes ?? "";
  const interactionNotes = ingredient.interaction_notes ?? "";

  return (
    <div className="space-y-10">
      <Hero
        title={ingredient.display_name}
        subtitle={ingredient.tagline ?? undefined}
      />

      <div className="mx-auto max-w-screen-md space-y-8">
        {ingredient.picture && (
          <div className="flex justify-center">
            <img
              src={ingredient.picture}
              alt={ingredient.display_name}
              className="h-40 w-40 rounded-xl object-cover"
            />
          </div>
        )}

        {desc && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold">이 천연물질은 무엇인가요?</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{desc}</p>
          </div>
        )}

        {mechanism && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold">어떤 기전 연구가 있나요?</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {mechanism}
            </p>
          </div>
        )}

        {safetyNotes && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold">주의사항</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {safetyNotes}
            </p>
          </div>
        )}

        {interactionNotes && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold">다른 성분·약물과의 상호작용</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {interactionNotes}
            </p>
          </div>
        )}

        {!desc && !mechanism && !safetyNotes && !interactionNotes && (
          <p className="text-muted-foreground">
            상세 정보가 등록되면 여기에 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
