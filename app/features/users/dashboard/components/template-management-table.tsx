import type { Category, RoutineTemplate } from "../types";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  templates: RoutineTemplate[];
  category: Category;
  onSelectTemplate: (template: RoutineTemplate) => void;
  onEditTemplate: (template: RoutineTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onReorderTemplates?: (templates: RoutineTemplate[]) => void;
}

function SortableRow({
  template,
  onEditTemplate,
  onDeleteTemplate,
}: {
  template: RoutineTemplate;
  onEditTemplate: (template: RoutineTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="text-muted-foreground size-3" />
          <span className="sr-only">Drag to reorder</span>
        </Button>
      </TableCell>
      <TableCell>
        <span className="font-medium">{template.name}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {categoryLabels[template.section_type]}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {template.items.length}개
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              onEditTemplate(template);
            }}
          >
            <Edit className="size-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)
              ) {
                onDeleteTemplate(template.id);
                toast.success("삭제되었습니다");
              }
            }}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TemplateManagementTable({
  templates,
  category,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onReorderTemplates,
}: TemplateManagementTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const categoryTemplates = React.useMemo(
    () => templates.filter((t) => t.section_type === category),
    [templates, category],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 이동해야 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categoryTemplates.findIndex((t) => t.id === active.id);
    const newIndex = categoryTemplates.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(categoryTemplates, oldIndex, newIndex).map(
      (template, index) => ({
        ...template,
        sort_order: index,
      }),
    );

    if (onReorderTemplates) {
      onReorderTemplates(newOrder);
    }
  };

  const columns: ColumnDef<RoutineTemplate>[] = React.useMemo(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: () => null, // SortableRow에서 처리
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categoryTemplates.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
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
                  <SortableRow
                    key={row.id}
                    template={row.original}
                    onEditTemplate={onEditTemplate}
                    onDeleteTemplate={onDeleteTemplate}
                  />
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
      </SortableContext>
    </DndContext>
  );
}
