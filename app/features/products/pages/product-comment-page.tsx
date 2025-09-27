import type { Route } from "./+types/product-comment-page";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "댓글 상세" },
    { name: "description", content: "댓글 상세 정보를 확인하세요" },
  ];
};

export default function ProductCommentPage({ 
  loaderData 
}: Route.ComponentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">댓글 상세</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          제품 ID: {loaderData?.productId}
        </p>
        <p className="text-gray-600">
          댓글 ID: {loaderData?.commentId}
        </p>
        <p className="mt-4">
          이 페이지는 특정 댓글의 상세 정보를 표시합니다.
        </p>
      </div>
    </div>
  );
} 