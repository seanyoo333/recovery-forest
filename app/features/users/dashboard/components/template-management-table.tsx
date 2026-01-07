import type { Category, SectionTemplate } from "../types";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Edit, GripVertical, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

const categoryLabels: Record<Category, string> = {
  exercise: "운동",
  sleep: "수면",
  supplement: "보조제",
  diet: "식단",
  therapy: "보조요법",
};

interface TemplateManagementTableProps {
  templates: SectionTemplate[];
  category: Category;
  onSelectTemplate: (template: SectionTemplate) => void;
  onEditTemplate: (template: SectionTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export function TemplateManagementTable({
  templates,
  category,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: TemplateManagementTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const categoryTemplates = React.useMemo(
    () => templates.filter((t) => t.section_type === category),
    [templates, category],
  );

  const columns: ColumnDef<SectionTemplate>[] = React.useMemo(
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
        accessorKey: "name",
        header: "루틴 이름",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "section_type",
        header: "타입",
        cell: ({ row }) => (
          <Badge variant="outline">
            {categoryLabels[row.original.section_type]}
          </Badge>
        ),
      },
      {
        id: "items_count",
        header: "아이템 수",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.items.length}개
          </span>
        ),
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEditTemplate(row.original)}
            >
              <Edit className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                if (
                  confirm(`"${row.original.name}" 템플릿을 삭제하시겠습니까?`)
                ) {
                  onDeleteTemplate(row.original.id);
                  toast.success("삭제되었습니다");
                }
              }}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [onSelectTemplate, onEditTemplate, onDeleteTemplate],
  );

  const table = useReactTable({
    data: categoryTemplates,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  return (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                템플릿이 없습니다. 새 템플릿을 만들어보세요.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
