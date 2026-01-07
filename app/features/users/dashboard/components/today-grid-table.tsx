import type {
  Category,
  CellKey,
  DailyGridLog,
  GridOption,
  TimeBlock,
} from "../types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

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
}

export function TodayGridTable({
  optionsByCategory,
  valueMap,
  visibleCategories,
  onCellChange,
  onOpenSettings,
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
            {visibleCategoryDefs.map((c) => (
              <TableHead key={c.key}>{c.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeBlocks.map((t) => (
            <TableRow key={t.key}>
              <TableCell className="font-medium">{t.label}</TableCell>
              {visibleCategoryDefs.map((c) => {
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
