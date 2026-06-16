/**
 * 수종 → 대표 사진(데모 스톡, public/). 무료 이미지(Wikimedia Commons).
 * 실제 숲별 사진 확보 시 이 매핑만 교체하면 된다.
 */
const CONIFER = ["소나무", "낙엽송", "잣나무", "기타침엽수", "리기다소나무"];

export function forestImage(species: string): string {
  if (species === "편백") return "/forest-hinoki.jpg";
  if (CONIFER.includes(species)) return "/forest-pine.jpg";
  return "/recovery-forest.png";
}

export const FOOD_IMAGE = "/food-bibimbap.jpg";
