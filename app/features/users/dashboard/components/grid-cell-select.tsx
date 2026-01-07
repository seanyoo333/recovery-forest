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

  const handleValueChange = (value: string) => {
    // Select 닫기
    setOpen(false);

    if (value === "__none__") {
      onChange({
        option_id: null,
        template_id: null,
        time_block: timeBlock,
        category,
      });
      return;
    }

    if (value === "__settings__") {
      // Select 닫힌 후 다음 마이크로태스크에서 Drawer 열기
      // 포탈/오버레이 충돌 방지
      queueMicrotask(() => {
        onOpenSettings();
      });
      return;
    }

    const opt = options.find((o) => o.id === value);
    if (!opt) return;

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
      value={valueOptionId ?? "__none__"}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="h-8 w-full">
        <SelectValue placeholder="미기록" />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="__none__">없음</SelectItem>
        {options.map((option) => (
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
