import { useMemo, useState } from "react";

import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

import type { PostReference } from "../reference-utils";

type ReferenceRow = {
  id: string;
  label: string;
  url: string;
  note: string;
};

const EMPTY_ROW: ReferenceRow = {
  id: "reference-row-0",
  label: "",
  url: "",
  note: "",
};

function toReferenceRows(references?: PostReference[]): ReferenceRow[] {
  if (!references?.length) return [EMPTY_ROW];
  return references.map((item, index) => ({
    id: `reference-row-${index}`,
    label: item.label,
    url: item.url,
    note: item.note ?? "",
  }));
}

export function ReferenceInputList({
  defaultReferences = [],
}: {
  defaultReferences?: PostReference[];
}) {
  const initialRows = useMemo(
    () => toReferenceRows(defaultReferences),
    [defaultReferences],
  );
  const [rows, setRows] = useState<ReferenceRow[]>(initialRows);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `reference-row-${Date.now()}`,
        label: "",
        url: "",
        note: "",
      },
    ]);
  };

  const updateRow = (
    id: string,
    key: keyof Omit<ReferenceRow, "id">,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      if (prev.length === 1) {
        return [{ ...prev[0], label: "", url: "", note: "" }];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>출처 목록</Label>
        <p className="text-muted-foreground text-sm">
          행 추가 버튼으로 출처를 입력하세요. 라벨과 URL은 필수입니다.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">출처 {index + 1}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                name="reference_label"
                value={row.label}
                onChange={(event) =>
                  updateRow(row.id, "label", event.currentTarget.value)
                }
                placeholder="출처 이름 (예: NRG-GY019 임상시험 정보)"
              />
              <Input
                name="reference_url"
                value={row.url}
                onChange={(event) =>
                  updateRow(row.id, "url", event.currentTarget.value)
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="flex gap-2">
              <Input
                name="reference_note"
                value={row.note}
                onChange={(event) =>
                  updateRow(row.id, "note", event.currentTarget.value)
                }
                placeholder="메모 (선택)"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeRow(row.id)}
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addRow}>
        + 출처 행 추가
      </Button>
    </div>
  );
}
