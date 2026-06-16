import {
  Camera,
  Car,
  Flower2,
  Footprints,
  Home,
  Leaf,
  MapPin,
  TreePine,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/** 회복 포인트 icon 키 → lucide 아이콘. */
const POINT_ICONS: Record<string, LucideIcon> = {
  tree: TreePine,
  walk: Footprints,
  meditation: Flower2,
  camera: Camera,
};

export function recoveryPointIcon(key: string): LucideIcon {
  return POINT_ICONS[key] ?? Leaf;
}

/** 동선 활동 문구 → 대표 아이콘(타임라인 썸네일용). */
export function activityIcon(activity: string): LucideIcon {
  if (activity.includes("출발")) return Car;
  if (activity.includes("귀가")) return Home;
  if (activity.includes("도착")) return MapPin;
  if (activity.includes("산책") || activity.includes("걷")) return Footprints;
  if (activity.includes("명상")) return Flower2;
  if (activity.includes("점심") || activity.includes("식사") || activity.includes("먹"))
    return Utensils;
  if (activity.includes("관광")) return Camera;
  return Leaf;
}
