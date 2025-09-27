import type { Route } from "./+types/product-comments-page";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "제품 댓글" },
    { name: "description", content: "제품 댓글을 확인하세요" },
  ];
};

export default function ProductCommentsPage({ 
  loaderData 
}: Route.ComponentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">제품 댓글</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          제품 ID: {loaderData?.productId}
        </p>
        <p className="mt-4">
          이 페이지는 제품의 댓글 목록을 표시합니다.
        </p>
      </div>
    </div>
  );
} 