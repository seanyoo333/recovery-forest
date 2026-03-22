import type { Route } from "./+types/targets-index-page";

import { Hero } from "~/core/components/hero";
import makeServerClient from "~/core/lib/supa-client.server";

import { TargetCard } from "../components/target-card";
import { groupTargetsByMetaAxis } from "../group-targets-by-meta-axis";
import { getTargets } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "표적별 모음 | 천연물질 | Evidence Base" },
    {
      name: "description",
      content:
        "5축(대사·면역·신호·신경·회복)으로 정리된 표적 목록과 천연물질(성분) 정보",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const raw = await getTargets(client);
  return groupTargetsByMetaAxis(raw);
}

export default function TargetsIndexPage({ loaderData }: Route.ComponentProps) {
  const { sections, unassigned } = loaderData;

  return (
    <div className="space-y-12">
      <Hero
        title="표적별 모음"
        subtitle="DB에 정의된 메타축(5축)별로 표적을 묶었습니다. 각 표적에서 연관 천연물 성분을 확인하세요."
      />

      <small className="block font-bold text-red-500">
        * 표적·5축 분류는 대표 기전에 의해 연구 논문을 근거로 정리되었습니다.
        <br />* 본 정보는 의학적 조언이 아니며, 약물을 대신하거나 약물로
        사용하는 것을 추천하지 않습니다.
      </small>

      <div className="space-y-14">
        {sections.map((section) =>
          section.targets.length === 0 ? null : (
            <section
              key={section.axis}
              className="scroll-mt-8 space-y-5"
              aria-labelledby={`axis-heading-${section.axis}`}
            >
              <div className="border-border max-w-3xl space-y-2 border-b pb-3">
                <h2
                  id={`axis-heading-${section.axis}`}
                  className="text-foreground text-2xl font-bold tracking-tight"
                >
                  {section.label}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {section.description}
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {section.targets.map((target) => (
                  <TargetCard
                    key={`${section.axis}-${target.id}`}
                    slug={target.slug}
                    name={target.display_name}
                    description={target.description}
                  />
                ))}
              </div>
            </section>
          ),
        )}

        {unassigned.length > 0 ? (
          <section
            className="scroll-mt-8 space-y-5"
            aria-labelledby="axis-heading-unassigned"
          >
            <div className="border-border max-w-3xl space-y-2 border-b pb-3">
              <h2
                id="axis-heading-unassigned"
                className="text-foreground text-2xl font-bold tracking-tight"
              >
                분류 미지정
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                아직 메타축(<code className="text-xs">target_to_meta_axis</code>
                )에 연결되지 않은 표적입니다.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {unassigned.map((target) => (
                <TargetCard
                  key={target.id}
                  slug={target.slug}
                  name={target.display_name}
                  description={target.description}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
