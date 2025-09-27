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
  console.log("Categories data:", loaderData.categories);
  console.log("Categories count:", loaderData.categories?.length);

  // 각 필터링된 결과도 확인
  const glucoseCategories =
    loaderData.categories?.filter(
      (category) => category.korean_main_energy === "포도당",
    ) || [];
  const glutamineCategories =
    loaderData.categories?.filter(
      (category) => category.korean_main_energy === "글루타민",
    ) || [];
  const fattyAcidCategories =
    loaderData.categories?.filter(
      (category) => category.korean_main_energy === "지방산",
    ) || [];

  console.log("Glucose categories:", glucoseCategories);
  console.log("Glutamine categories:", glutamineCategories);
  console.log("Fatty acid categories:", fattyAcidCategories);

  return (
    <div className="space-y-10">
      <Hero
        title="카테고리"
        subtitle="표적 관련 연구가 있는 제품 목록을 확인해보세요"
      />
      <small className="text-muted-foreground block font-bold text-red-500">
        * 카테고리별 분류는 대표 기전에 의해 연구 논문을 근거로 임의로
        분류되었습니다.
        <br />* 본 정보는 의학적 조언이 아니며, 약물을 대신하거나 약물로 사용할
        수 없습니다.
      </small>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* 포도당 카테고리 */}
        <div className="space-y-3">
          {glucoseCategories.map((category) => (
            <CategoryCard
              key={category.category_id}
              id={category.category_id}
              name={category.name}
              koreanName={category.korean_name}
              description={category.description}
              mainEnergy={category.main_energy}
              koreanMainEnergy={category.korean_main_energy}
              energyType="glucose"
            />
          ))}
        </div>

        {/* 글루타민 카테고리 */}
        <div className="space-y-3">
          {glutamineCategories.map((category) => (
            <CategoryCard
              key={category.category_id}
              id={category.category_id}
              name={category.name}
              koreanName={category.korean_name}
              description={category.description}
              mainEnergy={category.main_energy}
              koreanMainEnergy={category.korean_main_energy}
              energyType="glutamine"
            />
          ))}
        </div>
        {/* 지방산 카테고리 */}
        <div className="space-y-3">
          {fattyAcidCategories.map((category) => (
            <CategoryCard
              key={category.category_id}
              id={category.category_id}
              name={category.name}
              koreanName={category.korean_name}
              description={category.description}
              mainEnergy={category.main_energy}
              koreanMainEnergy={category.korean_main_energy}
              energyType="fatty_acid"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
