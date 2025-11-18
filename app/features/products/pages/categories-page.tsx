import type { Route } from "./+types/categories-page";

import { Hero } from "~/core/components/hero";
import makeServerClient from "~/core/lib/supa-client.server";
import { CategoryCard } from "~/features/products/components/category-card";
import { getCategories } from "~/features/products/queries";

export const meta: Route.MetaFunction = () => [
  { title: "Categories | Evidence Base" },
  { name: "description", content: "Browse products by category" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const categories = await getCategories(client);
  return { categories };
};

export default function CategoriesPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-10">
      <Hero
        title="카테고리"
        subtitle="표적 관련 연구가 있는 제품 목록을 확인해보세요"
      />
      <small className="block font-bold text-red-500">
        * 카테고리별 분류는 대표 기전에 의해 연구 논문을 근거로 임의로
        분류되었습니다.
        <br />* 본 정보는 의학적 조언이 아니며, 약물을 대신하거나 약물로
        사용하는 것을 추천하지 않습니다.
      </small>

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {loaderData.categories.map((category) => (
          <CategoryCard
            key={category.category_id}
            id={category.category_id}
            name={category.name}
            academicName={category.academic_name}
            target={category.target}
            description={category.description}
          />
        ))}
      </div>
    </div>
  );
}
