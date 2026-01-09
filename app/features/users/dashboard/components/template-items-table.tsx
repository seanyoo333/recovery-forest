import type { SectionItem } from "../types";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

interface TemplateItemsTableProps {
  items: SectionItem[];
  onItemsChange: (items: SectionItem[]) => void;
}

export function TemplateItemsTable({
  items,
  onItemsChange,
}: TemplateItemsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<SectionItem>[] = React.useMemo(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: () => (
          <Button variant="ghost" size="icon" className="size-7 cursor-grab">
            <GripVertical className="text-muted-foreground size-3" />
            <span className="sr-only">Drag to reorder</span>
          </Button>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "label",
        header: "이름",
        cell: ({ row, table }) => {
          const item = row.original;
          return (
            <Input
              className="h-8 w-full"
              defaultValue={item.label}
              onBlur={(e) => {
                const newItems = items.map((i) =>
                  i.id === item.id ? { ...i, label: e.target.value } : i,
                );
                onItemsChange(newItems);
                toast.success("저장되었습니다");
              }}
            />
          );
        },
      },
      {
        accessorKey: "amount_num",
        header: "용량",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="h-8 w-24"
                defaultValue={item.amount_num ?? ""}
                placeholder="500"
                onBlur={(e) => {
                  const newItems = items.map((i) =>
                    i.id === item.id
                      ? { ...i, amount_num: parseFloat(e.target.value) || null }
                      : i,
                  );
                  onItemsChange(newItems);
                }}
              />
              <Input
                className="h-8 w-20"
                defaultValue={item.amount_unit ?? ""}
                placeholder="mg"
                onBlur={(e) => {
                  const newItems = items.map((i) =>
                    i.id === item.id
                      ? { ...i, amount_unit: e.target.value }
                      : i,
                  );
                  onItemsChange(newItems);
                }}
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              const newItems = items.filter((i) => i.id !== row.original.id);
              onItemsChange(newItems);
              toast.success("삭제되었습니다");
            }}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        ),
      },
    ],
    [items, onItemsChange],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const handleAddItem = () => {
    const newItem: SectionItem = {
      id: `temp-${Date.now()}`,
      template_id: items[0]?.template_id || "",
      sort_order: items.length,
      label: "",
      ingredient_id: null,
      amount_num: null,
      amount_unit: null,
      meta: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onItemsChange([...items, newItem]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>루틴 항목</Label>
        <Button variant="outline" size="sm" onClick={handleAddItem}>
          <Plus className="size-4" />
          추가
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  항목이 없습니다. 추가 버튼을 클릭하여 추가하세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
