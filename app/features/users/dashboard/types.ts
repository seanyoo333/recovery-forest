/**
 * Health Habits Types
 *
 * 건강습관 기록 시스템의 타입 정의
 * database.types.ts의 자동 생성 타입을 활용합니다.
 */
import type { Database } from "database.types";

// database.types.ts에서 자동 생성된 enum 타입 사용
export type TimeBlock = Database["public"]["Enums"]["habit_time_block"];
export type Category = Database["public"]["Enums"]["habit_category"];
export type GridOptionKind = Database["public"]["Enums"]["grid_option_kind"];

export type CellKey = `${TimeBlock}:${Category}`;

// database.types.ts의 Row 타입을 기반으로 도메인 모델 타입 정의
export type GridOption = Database["public"]["Tables"]["grid_options"]["Row"];

export type DailyGridLog =
  Database["public"]["Tables"]["daily_grid_logs"]["Row"];

export type SectionTemplateRow =
  Database["public"]["Tables"]["section_templates"]["Row"];

export type SectionItemRow =
  Database["public"]["Tables"]["section_items"]["Row"];

// 확장 필드가 있는 도메인 모델 (items 등)
export interface SectionTemplate extends SectionTemplateRow {
  items: SectionItem[];
}

export interface SectionItem extends SectionItemRow {
  // Row 타입에 이미 필요한 필드가 모두 포함되어 있음
}

export interface GridCellValue {
  time_block: TimeBlock;
  category: Category;
  option_id: string | null;
  template_id: string | null;
}
