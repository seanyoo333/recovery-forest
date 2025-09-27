import type { Route } from "./+types/new-product-review-page";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "새 리뷰 작성" },
    { name: "description", content: "새로운 제품 리뷰를 작성하세요" },
  ];
};

export default function NewProductReviewPage({ 
  loaderData 
}: Route.ComponentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">새 리뷰 작성</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          제품 ID: {loaderData?.productId}
        </p>
        <p className="mt-4">
          이 페이지는 새로운 제품 리뷰를 작성하는 폼을 표시합니다.
        </p>
      </div>
    </div>
  );
} 