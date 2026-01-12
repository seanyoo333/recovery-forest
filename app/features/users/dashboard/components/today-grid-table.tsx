import type {
  Category,
  CellKey,
  DailyGridLog,
  GridOption,
  TimeBlock,
} from "../types";

import { X } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

import { CATEGORY_ALLOWED_TIME_BLOCKS } from "../constants";

import { GridCellSelect } from "./grid-cell-select";

const timeBlocks: { key: TimeBlock; label: string }[] = [
  { key: "am", label: "아침" },
  { key: "noon", label: "점심" },
  { key: "pm", label: "저녁" },
  { key: "bed", label: "자기전" },
];

const categories: { key: Category; label: string }[] = [
  { key: "exercise", label: "운동" },
  { key: "sleep", label: "수면" },
  { key: "supplement", label: "보조제" },
  { key: "diet", label: "식단" },
  { key: "therapy", label: "보조요법" },
];

interface TodayGridTableProps {
  optionsByCategory: Record<Category, GridOption[]>;
  valueMap: Partial<Record<CellKey, DailyGridLog>>;
  visibleCategories: Category[];
  onCellChange: (args: {
    time_block: TimeBlock;
    category: Category;
    option_id: string | null;
    template_id: string | null;
  }) => void;
  onOpenSettings: (category: Category, timeBlock: TimeBlock) => void;
  onClearCategory?: (category: Category) => void;
}

export function TodayGridTable({
  optionsByCategory,
  valueMap,
  visibleCategories,
  onCellChange,
  onOpenSettings,
  onClearCategory,
}: TodayGridTableProps) {
  const visibleCategoryDefs = categories.filter((c) =>
    visibleCategories.includes(c.key),
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-24">시간</TableHead>
            {visibleCategoryDefs.map((c) => {
              const options = optionsByCategory[c.key] ?? [];
              const noneOption = options.find((opt) => opt.label === "없음");
              const hasClearFunction = onClearCategory && noneOption;

              return (
                <TableHead key={c.key} className="relative">
                  <div className="flex items-center justify-between gap-2">
                    <span>{c.label}</span>
                    {hasClearFunction && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearCategory(c.key);
                        }}
                        title={`${c.label} 전체 없음`}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeBlocks.map((t) => {
            // 각 시간대에 대해 표시할 카테고리 필터링
            const categoriesForThisTimeBlock = visibleCategoryDefs.filter((c) =>
              CATEGORY_ALLOWED_TIME_BLOCKS[c.key].includes(t.key),
            );

            // 이 시간대에 표시할 카테고리가 없으면 행을 렌더링하지 않음
            if (categoriesForThisTimeBlock.length === 0) {
              return null;
            }

            return (
              <TableRow key={t.key}>
                <TableCell className="font-medium">{t.label}</TableCell>
                {visibleCategoryDefs.map((c) => {
                  // 카테고리가 이 시간대에 허용되지 않으면 빈 셀 표시
                  const isAllowed = CATEGORY_ALLOWED_TIME_BLOCKS[
                    c.key
                  ].includes(t.key);

                  if (!isAllowed) {
                    return (
                      <TableCell key={`${t.key}:${c.key}`} className="min-w-[160px]">
                        {/* 빈 셀 - 표시하지 않음 */}
                      </TableCell>
                    );
                  }

                  const cellKey = `${t.key}:${c.key}` as CellKey;
                  const log = valueMap[cellKey];

                  return (
                    <TableCell key={cellKey} className="min-w-[160px]">
                      <GridCellSelect
                        timeBlock={t.key}
                        category={c.key}
                        options={optionsByCategory[c.key] ?? []}
                        valueOptionId={log?.option_id ?? null}
                        onChange={(value) => {
                          onCellChange({
                            time_block: t.key,
                            category: c.key,
                            option_id: value.option_id,
                            template_id: value.template_id,
                          });
                        }}
                        onOpenSettings={() => onOpenSettings(c.key, t.key)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
