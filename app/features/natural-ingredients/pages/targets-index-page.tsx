import type { Route } from "./+types/targets-index-page";

import { Hero } from "~/core/components/hero";
import makeServerClient from "~/core/lib/supa-client.server";

import { TargetCard } from "../components/target-card";
import { getTargets } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "표적별 모음 | 천연물질 | Evidence Base" },
    {
      name: "description",
      content:
        "표적별로 정리된 천연물질(성분) 목록을 확인하세요. NF-κB, GLUT 등",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const targets = await getTargets(client);
  return { targets };
}

export default function TargetsIndexPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-10">
      <Hero
        title="표적별 모음"
        subtitle="표적 관련 연구가 있는 천연물질(성분) 목록을 확인하세요"
      />

      <small className="block font-bold text-red-500">
        * 표적별 분류는 대표 기전에 의해 연구 논문을 근거로 정리되었습니다.
        <br />* 본 정보는 의학적 조언이 아니며, 약물을 대신하거나 약물로
        사용하는 것을 추천하지 않습니다.
      </small>

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {loaderData.targets.map((target) => (
          <TargetCard
            key={target.id}
            slug={target.slug}
            name={target.display_name}
            description={target.description}
          />
        ))}
      </div>
    </div>
  );
}
