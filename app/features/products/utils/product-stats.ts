/**
 * Product Stats 타입 가드 함수
 * product.stats가 Json 타입이므로 안전하게 접근하기 위한 유틸리티
 */

export function getProductStats(stats: unknown) {
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
    return { views: 0, reviews: 0, upvotes: 0, is_upvoted: false };
  }
  const statsObj = stats as Record<string, unknown>;
  return {
    views: typeof statsObj.views === "number" ? statsObj.views : 0,
    reviews: typeof statsObj.reviews === "number" ? statsObj.reviews : 0,
    upvotes: typeof statsObj.upvotes === "number" ? statsObj.upvotes : 0,
    is_upvoted:
      typeof statsObj.is_upvoted === "boolean" ? statsObj.is_upvoted : false,
  };
}
