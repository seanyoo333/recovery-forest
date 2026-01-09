import type {
  Category,
  SectionItem,
  SectionTemplate,
  TimeBlock,
} from "../types";

import * as React from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/core/components/ui/sheet";
import { Textarea } from "~/core/components/ui/textarea";

import { TemplateItemsTable } from "./template-items-table";
import { TemplateManagementTable } from "./template-management-table";

const categoryLabels: Record<Category, string> = {
  exercise: "운동",
  sleep: "수면",
  supplement: "보조제",
  diet: "식단",
  therapy: "보조요법",
};

interface TemplateDrawerProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: SectionTemplate[];
  selectedTimeBlock?: TimeBlock;
  logDate: string;
  templateGridOptionMap?: Record<string, boolean>;
}

export function TemplateDrawer({
  category,
  open,
  onOpenChange,
  templates,
  selectedTimeBlock = "am",
  logDate,
  templateGridOptionMap = {},
}: TemplateDrawerProps) {
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = React.useState<"select" | "create">(
    "select",
  );
  const [editingTemplate, setEditingTemplate] =
    React.useState<SectionTemplate | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    notes: "",
    items: [] as SectionItem[],
  });

  // Drawer가 닫힐 때 상태 초기화
  React.useEffect(() => {
    if (!open) {
      setActiveTab("select");
      setEditingTemplate(null);
      setFormData({ name: "", notes: "", items: [] });
    }
  }, [open]);

  if (!category) return null;

  const categoryTemplates = templates.filter(
    (t) => t.section_type === category,
  );

  const handleCreateTemplate = () => {
    setFormData({ name: "", notes: "", items: [] });
    setEditingTemplate(null);
    setActiveTab("create");
  };

  const handleEditTemplate = (template: SectionTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      notes: template.notes || "",
      items: template.items.sort((a, b) => a.sort_order - b.sort_order),
    });
    setActiveTab("create");
  };

  const handleSaveTemplate = () => {
    if (!formData.name.trim()) {
      toast.error("템플릿 이름을 입력해주세요");
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append(
      "intent",
      editingTemplate ? "update-template" : "create-template",
    );
    formDataToSubmit.append("category", category);
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("notes", formData.notes);
    formDataToSubmit.append("items", JSON.stringify(formData.items));

    if (editingTemplate) {
      formDataToSubmit.append("templateId", editingTemplate.id);
    }

    fetcher.submit(formDataToSubmit, { method: "post" });

    setTimeout(() => {
      if (fetcher.data?.success) {
        toast.success(
          editingTemplate
            ? "템플릿이 수정되었습니다"
            : "템플릿이 생성되었습니다",
        );
        setActiveTab("select");
        setEditingTemplate(null);
        setFormData({ name: "", notes: "", items: [] });
      }
    }, 100);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("intent", "delete-template");
    formDataToSubmit.append("templateId", templateId);

    fetcher.submit(formDataToSubmit, { method: "post" });
  };

  const handleToggleGridOption = (templateId: string, enabled: boolean) => {
    if (!category) return;

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("intent", "toggle-grid-option");
    formDataToSubmit.append("templateId", templateId);
    formDataToSubmit.append("category", category);
    formDataToSubmit.append("enabled", enabled.toString());

    fetcher.submit(formDataToSubmit, { method: "post" });
  };

  const handleReorderTemplates = (reorderedTemplates: SectionTemplate[]) => {
    if (!category) return;

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("intent", "reorder-routines");
    formDataToSubmit.append("category", category);
    formDataToSubmit.append(
      "orders",
      JSON.stringify(
        reorderedTemplates.map((t, index) => ({
          id: t.id,
          sort_order: index,
        })),
      ),
    );

    fetcher.submit(formDataToSubmit, { method: "post" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{categoryLabels[category]} 루틴 설정</SheetTitle>
          <SheetDescription>
            자신만의 루틴을 선택하거나 생성하여 관리할 수 있습니다.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === "select" ? "default" : "ghost"}
              className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              onClick={() => {
                setActiveTab("select");
                setEditingTemplate(null);
                setFormData({ name: "", notes: "", items: [] });
              }}
            >
              루틴 선택
            </Button>
            <Button
              variant={activeTab === "create" ? "default" : "ghost"}
              className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              onClick={() => {
                if (!editingTemplate) {
                  setEditingTemplate(null);
                  setFormData({ name: "", notes: "", items: [] });
                }
                setActiveTab("create");
              }}
            >
              {editingTemplate ? "루틴 수정" : "루틴 생성"}
            </Button>
          </div>

          {activeTab === "select" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">루틴 목록</h3>

              {categoryTemplates.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>루틴이 없습니다</CardTitle>
                    <CardDescription>
                      새로운 루틴을 생성하려면 "루틴 생성" 탭을 사용하세요.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <>
                  <TemplateManagementTable
                    templates={templates}
                    category={category}
                    onSelectTemplate={() => {}}
                    onEditTemplate={handleEditTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onReorderTemplates={handleReorderTemplates}
                  />

                  <div className="space-y-2">
                    {categoryTemplates.map((template) => {
                      const isInGrid =
                        templateGridOptionMap[template.id] ?? false;
                      return (
                        <Card
                          key={template.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <Checkbox
                                id={`grid-option-${template.id}`}
                                checked={isInGrid}
                                onCheckedChange={(checked: boolean) => {
                                  handleToggleGridOption(
                                    template.id,
                                    checked === true,
                                  );
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {template.name}
                                </CardTitle>
                                {template.notes && (
                                  <CardDescription>
                                    {template.notes}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          {template.items.length > 0 && (
                            <CardContent>
                              <div className="space-y-1">
                                {template.items
                                  .sort((a, b) => a.sort_order - b.sort_order)
                                  .map((item) => (
                                    <div
                                      key={item.id}
                                      className="text-muted-foreground text-sm"
                                    >
                                      • {item.label}
                                      {item.amount_num &&
                                        ` ${item.amount_num}${item.amount_unit || ""}`}
                                    </div>
                                  ))}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "create" && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">루틴 이름</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 아침 등산 / 점심 보조제 섭취 / 저녁 지중해식 식단 / 자기전 명상 루틴"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-notes">메모</Label>
                  <Textarea
                    id="template-notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="루틴에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <TemplateItemsTable
                  items={formData.items}
                  onItemsChange={(items) => setFormData({ ...formData, items })}
                />
              </div>

              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab("select");
                    setEditingTemplate(null);
                    setFormData({ name: "", notes: "", items: [] });
                  }}
                >
                  취소
                </Button>
                <Button onClick={handleSaveTemplate}>저장</Button>
              </SheetFooter>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
