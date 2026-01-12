import type { Category, GridCellValue, GridOption, TimeBlock } from "../types";

import * as React from "react";

import { Button } from "~/core/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";

interface GridCellSelectProps {
  timeBlock: TimeBlock;
  category: Category;
  options: GridOption[];
  valueOptionId: string | null;
  onChange: (value: GridCellValue) => void;
  onOpenSettings: () => void;
}

export function GridCellSelect({
  timeBlock,
  category,
  options,
  valueOptionId,
  onChange,
  onOpenSettings,
}: GridCellSelectProps) {
  const [open, setOpen] = React.useState(false);

  // "없음" 옵션 찾기
  const noneOption = options.find((opt) => opt.label === "없음");
  const isNoneSelected = noneOption && valueOptionId === noneOption.id;

  const handleValueChange = (value: string) => {
    // Select 닫기
    setOpen(false);

    if (value === "__settings__") {
      // Select 닫힌 후 다음 마이크로태스크에서 Drawer 열기
      // 포탈/오버레이 충돌 방지
      queueMicrotask(() => {
        onOpenSettings();
      });
      return;
    }

    // "미입력" 옵션 선택 시 null로 설정
    if (value === "__unrecorded__") {
      onChange({
        option_id: null,
        template_id: null,
        time_block: timeBlock,
        category,
      });
      return;
    }

    const opt = options.find((o) => o.id === value);
    if (!opt) return;

    // "없음" 옵션을 다시 선택하면 미입력 상태로 복귀 (토글)
    if (opt.label === "없음" && isNoneSelected) {
      onChange({
        option_id: null,
        template_id: null,
        time_block: timeBlock,
        category,
      });
      return;
    }

    onChange({
      option_id: opt.id,
      template_id: opt.kind === "template" ? opt.template_id : null,
      time_block: timeBlock,
      category,
    });
  };

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={valueOptionId ?? ""}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="h-8 w-full">
        <SelectValue placeholder="미입력" />
      </SelectTrigger>
      <SelectContent align="start">
        {/* 미입력 상태가 아닐 때만 "미입력" 옵션 표시 */}
        {valueOptionId !== null && (
          <SelectItem value="__unrecorded__">미입력</SelectItem>
        )}
        {noneOption && <SelectItem value={noneOption.id}>없음</SelectItem>}
        {options
          .filter((opt) => opt.label !== "없음")
          .map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        <SelectItem value="__settings__" className="border-t">
          루틴설정…
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
