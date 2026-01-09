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
export type RoutineGridOption =
  Database["public"]["Tables"]["routine_grid_options"]["Row"];

export type RoutineDailyGridLog =
  Database["public"]["Tables"]["routine_daily_grid_logs"]["Row"];

export type RoutineTemplateRow =
  Database["public"]["Tables"]["routine_templates"]["Row"];

export type RoutineItemRow =
  Database["public"]["Tables"]["routine_items"]["Row"];

// 확장 필드가 있는 도메인 모델 (items 등)
export interface RoutineTemplate extends RoutineTemplateRow {
  items: RoutineItem[];
}

export interface RoutineItem extends RoutineItemRow {
  // Row 타입에 이미 필요한 필드가 모두 포함되어 있음
}

// 하위 호환성을 위한 별칭 (점진적 마이그레이션용)
export type SectionTemplate = RoutineTemplate;
export type SectionItem = RoutineItem;
export type SectionTemplateRow = RoutineTemplateRow;
export type SectionItemRow = RoutineItemRow;
export type GridOption = RoutineGridOption;
export type DailyGridLog = RoutineDailyGridLog;

export interface GridCellValue {
  time_block: TimeBlock;
  category: Category;
  option_id: string | null;
  template_id: string | null;
}
