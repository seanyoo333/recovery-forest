import type { Route } from "./+types/ingredient-overview-layout";

import { Link, NavLink, Outlet, useOutletContext } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button, buttonVariants } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";

import {
  getIngredientEvidenceBySlug,
  getIngredientBySlug,
} from "../queries";

export function meta({ data, params }: Route.MetaArgs) {
  const name = data?.ingredient?.display_name ?? params.slug;
  return [
    { title: `${name} | 천연물질 | Evidence Base` },
    {
      name: "description",
      content:
        data?.ingredient?.tagline ?? `${name} 성분의 정보와 근거 자료를 확인하세요`,
    },
  ];
}

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs & { params: { slug: string } }) => {
  const [client] = makeServerClient(request);
  const ingredient = await getIngredientBySlug(client, { slug: params.slug });
  if (!ingredient) throw new Response("Not Found", { status: 404 });

  const evidenceRows = await getIngredientEvidenceBySlug(client, {
    slug: params.slug,
  });

  const uniqueEvidence = new Map<string, (typeof evidenceRows)[number]>();
  for (const row of evidenceRows) {
    if (!row.evidence_id) continue;
    if (!uniqueEvidence.has(row.evidence_id)) {
      uniqueEvidence.set(row.evidence_id, row);
    }
  }

  const uniqueEvidenceRows = [...uniqueEvidence.values()];
  const targetCount = new Set(
    evidenceRows.map((row) => row.target_slug).filter(Boolean),
  ).size;
  const sourceCount = uniqueEvidenceRows.reduce(
    (sum, row) => sum + (row.evidence_count ?? 0),
    0,
  );
  const primarySourceCount = uniqueEvidenceRows.reduce(
    (sum, row) => sum + (row.primary_evidence_count ?? 0),
    0,
  );

  return {
    ingredient,
    evidenceRows,
    evidenceStats: {
      targetCount,
      evidenceCount: uniqueEvidenceRows.length,
      sourceCount,
      primarySourceCount,
    },
  };
};

export default function IngredientOverviewLayout({
  loaderData,
}: Route.ComponentProps) {
  const context = useOutletContext<{ isLoggedIn: boolean }>();
  const isLoggedIn = context?.isLoggedIn ?? false;

  const { ingredient, evidenceStats } = loaderData;

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-10 md:flex-row md:gap-0">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
          <div className="bg-primary/50 size-40 overflow-hidden rounded-xl shadow-xl">
            {ingredient.picture ? (
              <img
                src={ingredient.picture}
                alt={ingredient.display_name}
                className="size-full object-cover"
              />
            ) : (
              <div className="bg-muted flex size-full items-center justify-center">
                <span className="text-muted-foreground text-3xl">
                  {ingredient.display_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-center text-5xl font-bold md:text-left">
              {ingredient.display_name}
            </h1>
            <p className="text-muted-foreground text-center text-xl font-light md:text-left">
              {ingredient.tagline ?? "근거 기반 천연물질 정보"}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge variant="secondary">표적 {evidenceStats.targetCount}개</Badge>
              <Badge variant="secondary">
                근거 항목 {evidenceStats.evidenceCount}개
              </Badge>
              <Badge variant="secondary">
                주요 출처 {evidenceStats.primarySourceCount}개
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 md:flex-row md:gap-5">
          <Button
            variant="secondary"
            size="lg"
            asChild
            className="h-10 w-full px-10 md:h-14 md:w-auto md:text-lg"
          >
            <Link to={`/community?keyword=${encodeURIComponent(ingredient.display_name)}`}>
              커뮤니티 토론 보기
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-10 w-full px-10 md:h-14 md:w-auto md:text-lg"
          >
            <Link to="/natural-ingredients/targets">표적별 모음</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <NavLink
          end
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            )
          }
          to={`/natural-ingredients/${ingredient.slug}/overview`}
        >
          개요
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            )
          }
          to={`/natural-ingredients/${ingredient.slug}/evidence`}
        >
          근거
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            )
          }
          to={`/natural-ingredients/${ingredient.slug}/discussion`}
        >
          토론
        </NavLink>
      </div>

      <Outlet
        context={{
          ingredient,
          evidenceRows: loaderData.evidenceRows,
          evidenceStats: loaderData.evidenceStats,
          isLoggedIn,
        }}
      />
    </div>
  );
}
