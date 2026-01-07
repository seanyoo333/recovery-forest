import type { Category, CellKey, GridCellValue, TimeBlock } from "../types";
import type { Route } from "./+types/dashboard-health-habits";

import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { HealthHeatmap } from "../components/health-heatmap";
import { HealthStatusCard } from "../components/health-status-card";
import { TemplateDrawer } from "../components/template-drawer";
import { TodayGridTable } from "../components/today-grid-table";
import {
  initializeDefaultGridOptions,
  upsertDailyGridLog,
  upsertGridOption,
  upsertSectionItems,
  upsertSectionTemplate,
} from "../mutations";
import {
  getDailyGridLogs,
  getDailyGridLogsByDateRange,
  getGridOptions,
  getSectionTemplates,
} from "../queries";
import {
  calculateCategoryDeltas,
  calculateDailyTotal,
  calculatePeriodCategoryScores,
  calculatePeriodScores,
  calculateStreak,
  calculateTrafficLight,
  countFilledCategories,
  evaluateCategories,
  findWorstCategory,
  generateHeatmapData,
  generateHeatmapInsight,
  recommendNextAction,
} from "../utils";

export const meta: Route.MetaFunction = () => {
  return [{ title: "건강습관 기록 | Dashboard" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const week7Start = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const month30Start = format(subDays(new Date(), 30), "yyyy-MM-dd");

  // 기본 그리드 옵션 초기화 (없으면 생성)
  await initializeDefaultGridOptions(client, userId);

  const [options, todayLogs, templates, pastLogs] = await Promise.all([
    getGridOptions(client, userId),
    getDailyGridLogs(client, userId, today),
    getSectionTemplates(client, userId),
    getDailyGridLogsByDateRange(client, userId, month30Start, yesterday),
  ]);

  // 일별 점수 계산 (최근 30일)
  const dailyScores = [];
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const dateLogs =
      date === today
        ? todayLogs
        : pastLogs.filter((log) => log.log_date === date);
    const total = calculateDailyTotal(dateLogs, options);
    const filledCount = countFilledCategories(dateLogs);
    dailyScores.push({ date, total, filledCount });
  }

  // 기간별 점수 계산
  const periodScores = calculatePeriodScores(dailyScores, today);

  // 오늘 점수 및 상태
  const todayTotal = calculateDailyTotal(todayLogs, options);
  const todayFilledCount = countFilledCategories(todayLogs);
  const trafficLight = calculateTrafficLight(
    todayFilledCount,
    todayTotal,
    periodScores,
  );

  // 카테고리별 평가
  const periodCategoryScores = calculatePeriodCategoryScores(
    pastLogs,
    options,
    week7Start,
    month30Start,
    today,
  );
  const categoryEvaluations = evaluateCategories(
    todayLogs,
    periodCategoryScores,
    options,
  );

  // 다음 행동 추천
  const nextAction = recommendNextAction(categoryEvaluations);

  // 스트릭 계산
  const streak = calculateStreak(dailyScores, today);

  // 히트맵 데이터 생성
  const dailyLogsByDate = new Map<string, typeof todayLogs>();
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const dateLogs =
      date === today
        ? todayLogs
        : pastLogs.filter((log) => log.log_date === date);
    dailyLogsByDate.set(date, dateLogs);
  }

  const heatmapData = generateHeatmapData(
    dailyLogsByDate,
    options,
    month30Start,
    today,
  );

  // 카테고리별 delta 계산 및 worst category 찾기
  const categoryDeltas = calculateCategoryDeltas(
    dailyLogsByDate,
    options,
    periodCategoryScores,
    week7Start,
    today,
  );
  const worstCategory = findWorstCategory(categoryDeltas);

  // 히트맵 판단 문장 생성
  const heatmapInsight = generateHeatmapInsight(
    todayFilledCount,
    worstCategory,
  );

  // 카테고리별로 옵션 그룹화
  const optionsByCategory = options.reduce(
    (acc, opt) => {
      if (!acc[opt.category]) acc[opt.category] = [];
      acc[opt.category].push(opt);
      return acc;
    },
    {} as Record<Category, typeof options>,
  );

  // 템플릿별로 그리드 옵션이 있는지 확인하는 맵 생성
  const templateGridOptionMap = new Map<string, boolean>();
  templates.forEach((template) => {
    const hasGridOption = options.some(
      (opt) => opt.template_id === template.id && opt.is_active,
    );
    templateGridOptionMap.set(template.id, hasGridOption);
  });

  // 로그를 CellKey로 매핑
  const valueMap = todayLogs.reduce(
    (acc, log) => {
      const key = `${log.time_block}:${log.category}` as CellKey;
      acc[key] = log;
      return acc;
    },
    {} as Partial<Record<CellKey, (typeof todayLogs)[0]>>,
  );

  return {
    optionsByCategory,
    valueMap,
    logDate: today,
    templates,
    templateGridOptionMap: Object.fromEntries(templateGridOptionMap),
    trafficLight,
    categoryEvaluations,
    nextAction,
    streak,
    periodScores,
    heatmapData,
    heatmapInsight,
  };
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    if (!userId) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "upsert-cell") {
      const logDate = formData.get("logDate") as string;
      const timeBlock = formData.get(
        "timeBlock",
      ) as GridCellValue["time_block"];
      const category = formData.get("category") as Category;
      const optionId = formData.get("optionId");
      const templateId = formData.get("templateId");

      await upsertDailyGridLog(client, userId, logDate, {
        time_block: timeBlock,
        category,
        option_id: optionId ? String(optionId) : null,
        template_id: templateId ? String(templateId) : null,
      });

      return { success: true };
    }

    if (intent === "select-template") {
      const category = formData.get("category") as Category;
      const templateId = formData.get("templateId") as string;
      const timeBlock = formData.get(
        "timeBlock",
      ) as GridCellValue["time_block"];
      const logDate = formData.get("logDate") as string;

      // 템플릿 정보 가져오기
      const { data: template, error: templateError } = await client
        .from("section_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError || !template) {
        return { success: false, error: "템플릿을 찾을 수 없습니다." };
      }

      // 그리드 옵션 생성/업데이트
      const { data: existingOption } = await client
        .from("grid_options")
        .select("id")
        .eq("user_id", userId)
        .eq("category", category)
        .eq("template_id", templateId)
        .maybeSingle();

      let optionId: string;
      if (existingOption) {
        optionId = existingOption.id;
      } else {
        // 새 옵션 생성
        const { data: newOption, error: optionError } = await client
          .from("grid_options")
          .insert({
            user_id: userId,
            category,
            label: template.name,
            kind: "template",
            template_id: templateId,
            sort_order: 0,
          })
          .select("id")
          .single();

        if (optionError) {
          console.error("[select-template] grid_options insert error:", {
            code: optionError.code,
            message: optionError.message,
            details: optionError.details,
            hint: optionError.hint,
            templateId,
            category,
            userId,
            error: optionError,
          });
          // 23505: unique constraint violation
          if (optionError.code === "23505") {
            return {
              success: false,
              error: "이미 활성화된 항목이 있거나 중복입니다.",
            };
          }
          throw optionError;
        }
        optionId = newOption.id;
      }

      // 그리드 로그에 저장
      await upsertDailyGridLog(client, userId, logDate, {
        time_block: timeBlock,
        category,
        option_id: optionId,
        template_id: templateId,
      });

      return { success: true };
    }

    if (intent === "create-template" || intent === "update-template") {
      const category = formData.get("category") as Category;
      const name = formData.get("name") as string;
      const notes = formData.get("notes") as string;
      const itemsJson = formData.get("items") as string;
      const templateId = formData.get("templateId") as string | null;

      let finalTemplateId: string;

      if (intent === "update-template" && templateId) {
        // 템플릿 업데이트
        await upsertSectionTemplate(client, userId, {
          id: templateId,
          section_type: category,
          name,
          notes: notes || null,
        });
        finalTemplateId = templateId;
      } else {
        // 템플릿 생성
        const template = await upsertSectionTemplate(client, userId, {
          section_type: category,
          name,
          notes: notes || null,
        });
        finalTemplateId = template.id;
      }

      // 아이템 저장
      if (itemsJson) {
        const items = JSON.parse(itemsJson) as Array<{
          id?: string;
          label: string;
          amount_num?: number | null;
          amount_unit?: string | null;
          sort_order: number;
        }>;

        await upsertSectionItems(client, finalTemplateId, items);
      }

      // 루틴 생성 시 자동으로 그리드 옵션에 추가
      if (intent === "create-template") {
        const { data: template } = await client
          .from("section_templates")
          .select("*")
          .eq("id", finalTemplateId)
          .single();

        if (template) {
          // 기존 레코드 확인
          const { data: existingOption } = await client
            .from("grid_options")
            .select("id")
            .eq("user_id", userId)
            .eq("category", category)
            .eq("template_id", finalTemplateId)
            .maybeSingle();

          if (existingOption) {
            // 이미 있으면 활성화
            const { error } = await client
              .from("grid_options")
              .update({ is_active: true, label: template.name })
              .eq("id", existingOption.id);

            if (error) {
              console.error("[create-template] grid_options update error:", {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                templateId: finalTemplateId,
                category,
                existingOptionId: existingOption.id,
                error,
              });
              // 23505: unique constraint violation
              if (error.code === "23505") {
                return {
                  success: false,
                  error: "이미 활성화된 항목이 있거나 중복입니다.",
                };
              }
              throw error;
            }
          } else {
            // 새로 생성 (sort_order는 0으로 고정, 나중에 drag로 정렬)
            const { error: optionError } = await client
              .from("grid_options")
              .insert({
                user_id: userId,
                category,
                label: template.name,
                kind: "template",
                template_id: finalTemplateId,
                sort_order: 0,
                is_active: true,
              });

            if (optionError) {
              console.error("[create-template] grid_options insert error:", {
                code: optionError.code,
                message: optionError.message,
                details: optionError.details,
                hint: optionError.hint,
                templateId: finalTemplateId,
                category,
                userId,
                error: optionError,
              });
              // 23505: unique constraint violation
              if (optionError.code === "23505") {
                return {
                  success: false,
                  error: "이미 활성화된 항목이 있거나 중복입니다.",
                };
              }
              throw optionError;
            }
          }
        }
      }

      return { success: true };
    }

    if (intent === "delete-template") {
      const templateId = formData.get("templateId") as string;

      const { error } = await client
        .from("section_templates")
        .delete()
        .eq("id", templateId)
        .eq("user_id", userId);

      if (error) throw error;

      return { success: true };
    }

    if (intent === "toggle-grid-option") {
      const templateId = formData.get("templateId") as string;
      const category = formData.get("category") as Category;
      const enabled = formData.get("enabled") === "true";

      // 템플릿 정보 가져오기
      const { data: template, error: templateError } = await client
        .from("section_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError || !template) {
        return { success: false, error: "템플릿을 찾을 수 없습니다." };
      }

      if (enabled) {
        // enabled=true: template_id로 기존 레코드 확인 (is_active 여부와 관계없이)
        const { data: existingOption } = await client
          .from("grid_options")
          .select("id, is_active")
          .eq("user_id", userId)
          .eq("category", category)
          .eq("template_id", templateId)
          .maybeSingle();

        if (existingOption) {
          // 기존 레코드가 있으면 활성화 (이미 활성화되어 있어도 업데이트)
          const { error } = await client
            .from("grid_options")
            .update({ is_active: true, label: template.name })
            .eq("id", existingOption.id);

          if (error) {
            console.error("[toggle-grid-option] enabled=true update error:", {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              templateId,
              category,
              existingOptionId: existingOption.id,
              error,
            });
            // 23505: unique constraint violation
            if (error.code === "23505") {
              return {
                success: false,
                error: "이미 활성화된 항목이 있거나 중복입니다.",
              };
            }
            throw error;
          }
        } else {
          // 새 레코드 생성 (sort_order는 0으로 고정, 나중에 drag로 정렬)
          const { error } = await client.from("grid_options").insert({
            user_id: userId,
            category,
            label: template.name,
            kind: "template",
            template_id: templateId,
            sort_order: 0,
            is_active: true,
          });

          if (error) {
            console.error("[toggle-grid-option] enabled=true insert error:", {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              templateId,
              category,
              userId,
              error,
            });
            // 23505: unique constraint violation
            if (error.code === "23505") {
              return {
                success: false,
                error: "이미 활성화된 항목이 있거나 중복입니다.",
              };
            }
            throw error;
          }
        }
      } else {
        // enabled=false: is_active=false로 update (없으면 그냥 성공)
        const { data: existingOption } = await client
          .from("grid_options")
          .select("id")
          .eq("user_id", userId)
          .eq("category", category)
          .eq("template_id", templateId)
          .maybeSingle();

        if (existingOption) {
          const { error } = await client
            .from("grid_options")
            .update({ is_active: false })
            .eq("id", existingOption.id);

          if (error) {
            console.error("[toggle-grid-option] enabled=false update error:", {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              templateId,
              category,
              existingOptionId: existingOption.id,
              error,
            });
            throw error;
          }
        }
        // 레코드가 없으면 이미 비활성화된 상태이므로 성공으로 처리
      }

      return { success: true };
    }

    return { success: false };
  } catch (e) {
    const errorInfo: Record<string, unknown> = {
      error: e,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    };

    // Supabase 에러인 경우 추가 정보 출력
    if (e && typeof e === "object" && "code" in e) {
      const supabaseError = e as {
        code?: string;
        message?: string;
        details?: string;
        hint?: string;
      };
      errorInfo.code = supabaseError.code;
      errorInfo.message = supabaseError.message;
      errorInfo.details = supabaseError.details;
      errorInfo.hint = supabaseError.hint;
    }

    console.error("[health-habits action error]", errorInfo);
    throw e; // 개발 중엔 그대로 터뜨리기
  }
}

const categoryDefs = [
  { key: "exercise" as Category, label: "운동" },
  { key: "sleep" as Category, label: "수면" },
  { key: "supplement" as Category, label: "보조제" },
  { key: "diet" as Category, label: "식단" },
  { key: "therapy" as Category, label: "보조요법" },
] as const;

const DEFAULT_VISIBLE_CATEGORIES: Category[] = ["exercise", "sleep"];

function loadVisibleCategories(): Category[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_CATEGORIES;

  const raw = localStorage.getItem("healthHabits.visibleCategories");
  if (!raw) return DEFAULT_VISIBLE_CATEGORIES;

  try {
    const parsed = JSON.parse(raw) as Category[];
    return parsed.length > 0 ? parsed : DEFAULT_VISIBLE_CATEGORIES;
  } catch {
    return DEFAULT_VISIBLE_CATEGORIES;
  }
}

function saveVisibleCategories(categories: Category[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "healthHabits.visibleCategories",
    JSON.stringify(categories),
  );
}

export default function DashboardHealthHabits({
  loaderData,
}: Route.ComponentProps) {
  const fetcher = useFetcher();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock>("am");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Category[]>(() =>
    loadVisibleCategories(),
  );

  // localStorage에 저장
  useEffect(() => {
    saveVisibleCategories(visibleCategories);
  }, [visibleCategories]);

  const handleCellChange = (payload: {
    time_block: GridCellValue["time_block"];
    category: Category;
    option_id: string | null;
    template_id: string | null;
  }) => {
    const formData = new FormData();
    formData.append("intent", "upsert-cell");
    formData.append("logDate", loaderData.logDate);
    formData.append("timeBlock", payload.time_block);
    formData.append("category", payload.category);
    if (payload.option_id) formData.append("optionId", payload.option_id);
    if (payload.template_id) formData.append("templateId", payload.template_id);

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-3xl font-bold">오늘의 건강습관</h1>
        <p className="text-muted-foreground mt-2">
          {format(new Date(loaderData.logDate), "yyyy년 MM월 dd일 EEEE", {
            locale: ko,
          })}
        </p>
      </div>

      <HealthStatusCard
        trafficLight={loaderData.trafficLight}
        categoryEvaluations={loaderData.categoryEvaluations}
        nextAction={loaderData.nextAction}
        streak={loaderData.streak}
      />

      <div className="flex items-center justify-between gap-2">
        <div />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" />
              카테고리 선택
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => {
                const allSelected =
                  visibleCategories.length === categoryDefs.length;
                const next = allSelected
                  ? [categoryDefs[0].key] // 최소 1개는 유지
                  : categoryDefs.map((c) => c.key);
                saveVisibleCategories(next);
                setVisibleCategories(next);
              }}
            >
              {visibleCategories.length === categoryDefs.length
                ? "전체 해제"
                : "전체 선택"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {categoryDefs.map((c) => {
              const checked = visibleCategories.includes(c.key);
              return (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={checked}
                  onCheckedChange={(nextChecked) => {
                    setVisibleCategories((current) => {
                      const next = nextChecked
                        ? [...current, c.key]
                        : current.filter((x) => x !== c.key);

                      // 최소 1개는 유지
                      if (next.length === 0) return current;

                      saveVisibleCategories(next);
                      return next;
                    });
                  }}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TodayGridTable
        optionsByCategory={loaderData.optionsByCategory}
        valueMap={loaderData.valueMap}
        visibleCategories={visibleCategories}
        onCellChange={handleCellChange}
        onOpenSettings={(category, timeBlock) => {
          setSelectedCategory(category);
          setSelectedTimeBlock(timeBlock);
          setIsDrawerOpen(true);
        }}
      />

      <HealthHeatmap
        data={loaderData.heatmapData}
        insight={loaderData.heatmapInsight}
      />

      <TemplateDrawer
        category={selectedCategory}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        templates={loaderData.templates}
        selectedTimeBlock={selectedTimeBlock}
        logDate={loaderData.logDate}
        templateGridOptionMap={loaderData.templateGridOptionMap}
      />
    </div>
  );
}
