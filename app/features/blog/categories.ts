export const BLOG_CATEGORIES = [
  {
    slug: "cancer-metabolism",
    name: "암 대사",
    description: "암 대사, 대사치료, 대사 관련 연구를 다룹니다.",
  },
  {
    slug: "standard-care",
    name: "표준치료 준비와 회복",
    description: "수술, 항암, 방사선치료 전후 준비와 회복 정보를 다룹니다.",
  },
  {
    slug: "off-label-drugs",
    name: "오프라벨 드럭",
    description: "재창출 약물과 오프라벨 사용 이슈를 근거 중심으로 정리합니다.",
  },
  {
    slug: "immunotherapy",
    name: "면역요법",
    description: "면역항암제, 면역 조절, 관련 보조요법을 다룹니다.",
  },
  {
    slug: "natural-compounds",
    name: "천연물질 및 보조요법",
    description: "천연물질, 보충제, 보조요법의 근거와 주의점을 다룹니다.",
  },
  {
    slug: "nutrition-diet",
    name: "영양 및 식단",
    description: "치료 중 식사, 영양, 식단 관리 정보를 다룹니다.",
  },
  {
    slug: "lifestyle-healing",
    name: "생활습관 및 치유",
    description: "운동, 수면, 스트레스, 회복 루틴과 치유 환경을 다룹니다.",
  },
  {
    slug: "research-review",
    name: "논문 리뷰",
    description: "논문과 임상 연구를 읽기 쉽게 정리합니다.",
  },
  {
    slug: "cancer-news",
    name: "암 소식",
    description: "암 관련 뉴스, 승인, 가이드라인 업데이트를 다룹니다.",
  },
  {
    slug: "notice",
    name: "공지사항",
    description: "사이트와 블로그 운영 공지를 다룹니다.",
  },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type BlogCategorySlug = BlogCategory["slug"];

const CATEGORY_BY_SLUG = new Map(
  BLOG_CATEGORIES.map((category) => [category.slug, category]),
);

const LEGACY_CATEGORY_ALIASES: Record<string, BlogCategorySlug> = {
  "대사치료": "cancer-metabolism",
  "암 대사": "cancer-metabolism",
  "암 대사치료": "cancer-metabolism",
  "대사치료, 유방암": "cancer-metabolism",
  "대사치료, 천연물": "natural-compounds",
  "면역요법": "immunotherapy",
  "천연물": "natural-compounds",
  "천연물질": "natural-compounds",
  "영양 및 식단": "nutrition-diet",
  "생활습관": "lifestyle-healing",
  "건강 및 치유": "lifestyle-healing",
  "산림치유": "lifestyle-healing",
  "논문 리뷰": "research-review",
  "암 소식": "cancer-news",
  "공지사항": "notice",
  "가이드": "notice",
  "추천제품": "notice",
  Product: "notice",
  Personal: "notice",
  Thoughts: "notice",
};

export function getBlogCategory(value: unknown): BlogCategory {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const bySlug = CATEGORY_BY_SLUG.get(trimmed as BlogCategorySlug);
    if (bySlug) {
      return bySlug;
    }

    const aliasSlug = LEGACY_CATEGORY_ALIASES[trimmed];
    if (aliasSlug) {
      return CATEGORY_BY_SLUG.get(aliasSlug) ?? BLOG_CATEGORIES[0];
    }
  }

  return CATEGORY_BY_SLUG.get("notice") ?? BLOG_CATEGORIES[0];
}
