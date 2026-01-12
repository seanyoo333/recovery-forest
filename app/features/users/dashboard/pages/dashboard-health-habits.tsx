import type { Category, CellKey, GridCellValue, TimeBlock } from "../types";
import type { Route } from "./+types/dashboard-health-habits";

import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Filter, X } from "lucide-react";
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
import { CATEGORY_ALLOWED_TIME_BLOCKS } from "../constants";
import {
  initializeDefaultGridOptions,
  upsertDailyGridLog,
  upsertGridOption,
  upsertRoutineItems,
  upsertRoutineTemplate,
  upsertStreak,
} from "../mutations";
import {
  getDailyGridLogs,
  getDailyGridLogsByDateRange,
  getGridOptions,
  getSectionTemplates,
  getStreak,
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

  const [options, todayLogs, templates, pastLogs, existingStreak] =
    await Promise.all([
      getGridOptions(client, userId),
      getDailyGridLogs(client, userId, today),
      getSectionTemplates(client, userId),
      getDailyGridLogsByDateRange(client, userId, month30Start, yesterday),
      getStreak(client, userId),
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

  // 스트릭 계산 (기존 longest_streak 사용)
  const existingLongestStreak = existingStreak?.longest_streak ?? 0;
  const streak = calculateStreak(dailyScores, today, existingLongestStreak);

  // 스트릭 정보를 데이터베이스에 저장
  await upsertStreak(client, {
    userId,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastLogDate: streak.lastRecordDate,
  });

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

    if (intent === "upsert-multiple-cells") {
      const logDate = formData.get("logDate") as string;
      const cellsJson = formData.get("cells") as string;
      const cells = JSON.parse(cellsJson) as Array<{
        time_block: GridCellValue["time_block"];
        category: Category;
        option_id: string | null;
        template_id: string | null;
      }>;

      // 모든 셀을 순차적으로 처리
      for (const cell of cells) {
        await upsertDailyGridLog(client, userId, logDate, {
          time_block: cell.time_block,
          category: cell.category,
          option_id: cell.option_id,
          template_id: cell.template_id,
        });
      }

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
        .from("routine_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError || !template) {
        return { success: false, error: "템플릿을 찾을 수 없습니다." };
      }

      // 그리드 옵션 생성/업데이트
      const { data: existingOption } = await client
        .from("routine_grid_options")
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
          .from("routine_grid_options")
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
        await upsertRoutineTemplate(client, userId, {
          id: templateId,
          section_type: category,
          name,
          notes: notes || null,
        });
        finalTemplateId = templateId;
      } else {
        // 템플릿 생성
        const template = await upsertRoutineTemplate(client, userId, {
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
          ingredient_id?: string | null;
          amount_num?: number | null;
          amount_unit?: string | null;
          sort_order: number;
        }>;

        await upsertRoutineItems(client, finalTemplateId, items);
      }

      // 템플릿 이름 변경 시 그리드 옵션 label 업데이트
      if (intent === "update-template" && templateId) {
        const { data: existingOption } = await client
          .from("routine_grid_options")
          .select("id, label")
          .eq("user_id", userId)
          .eq("category", category)
          .eq("template_id", templateId)
          .maybeSingle();

        if (existingOption && existingOption.label !== name) {
          // 같은 이름의 프리셋이 있는지 확인 (template_id IS NULL)
          const { data: conflictingPreset } = await client
            .from("routine_grid_options")
            .select("id")
            .eq("user_id", userId)
            .eq("category", category)
            .eq("label", name)
            .is("template_id", null)
            .maybeSingle();

          if (conflictingPreset) {
            return {
              success: false,
              error: `"${name}"라는 이름의 프리셋이 이미 존재합니다. 다른 이름을 사용해주세요.`,
            };
          }

          // 그리드 옵션 label 업데이트
          const { error: updateError } = await client
            .from("routine_grid_options")
            .update({ label: name })
            .eq("id", existingOption.id);

          if (updateError) {
            console.error("[update-template] grid_options update error:", {
              code: updateError.code,
              message: updateError.message,
              details: updateError.details,
              hint: updateError.hint,
              templateId,
              category,
              existingOptionId: existingOption.id,
              error: updateError,
            });
            if (updateError.code === "23505") {
              return {
                success: false,
                error: `"${name}"라는 이름이 이미 사용 중입니다. 다른 이름을 사용해주세요.`,
              };
            }
            throw updateError;
          }
        }
      }

      // 루틴 생성 시 자동으로 그리드 옵션에 추가
      if (intent === "create-template") {
        const { data: template } = await client
          .from("routine_templates")
          .select("*")
          .eq("id", finalTemplateId)
          .single();

        if (template) {
          // 기존 레코드 확인
          const { data: existingOption } = await client
            .from("routine_grid_options")
            .select("id")
            .eq("user_id", userId)
            .eq("category", category)
            .eq("template_id", finalTemplateId)
            .maybeSingle();

          if (existingOption) {
            // 이미 있으면 활성화 (label은 변경하지 않음)
            const { error } = await client
              .from("routine_grid_options")
              .update({ is_active: true })
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
              if (error.code === "23505") {
                return {
                  success: false,
                  error: "이미 활성화된 항목이 있거나 중복입니다.",
                };
              }
              throw error;
            }
          } else {
            // 같은 이름의 프리셋 또는 삭제된 템플릿의 그리드 옵션이 있는지 확인
            const { data: conflictingOption } = await client
              .from("routine_grid_options")
              .select("id")
              .eq("user_id", userId)
              .eq("category", category)
              .eq("label", template.name)
              .is("template_id", null)
              .maybeSingle();

            if (conflictingOption) {
              // 삭제된 템플릿의 그리드 옵션이 있으면 삭제하고 새로 생성
              const { error: deleteError } = await client
                .from("routine_grid_options")
                .delete()
                .eq("id", conflictingOption.id);

              if (deleteError) {
                console.error("[create-template] grid_options delete error:", {
                  code: deleteError.code,
                  message: deleteError.message,
                  details: deleteError.details,
                  hint: deleteError.hint,
                  conflictingOptionId: conflictingOption.id,
                  error: deleteError,
                });
                throw deleteError;
              }
            }

            // 새로 생성 (sort_order는 0으로 고정, 나중에 drag로 정렬)
            const { error: optionError } = await client
              .from("routine_grid_options")
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
              if (optionError.code === "23505") {
                return {
                  success: false,
                  error: `"${template.name}"라는 이름이 이미 사용 중입니다. 다른 이름을 사용해주세요.`,
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

      // 템플릿 삭제 전에 관련 그리드 옵션도 삭제
      const { error: gridOptionError } = await client
        .from("routine_grid_options")
        .delete()
        .eq("user_id", userId)
        .eq("template_id", templateId);

      if (gridOptionError) {
        console.error("[delete-template] grid_options delete error:", {
          code: gridOptionError.code,
          message: gridOptionError.message,
          details: gridOptionError.details,
          hint: gridOptionError.hint,
          templateId,
          error: gridOptionError,
        });
        throw gridOptionError;
      }

      // 템플릿 삭제
      const { error } = await client
        .from("routine_templates")
        .delete()
        .eq("id", templateId)
        .eq("user_id", userId);

      if (error) throw error;

      return { success: true };
    }

    if (intent === "reorder-routines") {
      const category = formData.get("category") as Category;
      const ordersJson = formData.get("orders") as string;
      const orders = JSON.parse(ordersJson) as Array<{
        id: string;
        sort_order: number;
      }>;

      // 배치 업데이트
      for (const order of orders) {
        const { error } = await client
          .from("routine_templates")
          .update({ sort_order: order.sort_order })
          .eq("id", order.id)
          .eq("user_id", userId)
          .eq("section_type", category);

        if (error) {
          console.error("[reorder-routines] update error:", {
            code: error.code,
            message: error.message,
            templateId: order.id,
            error,
          });
          throw error;
        }
      }

      return { success: true };
    }

    if (intent === "toggle-grid-option") {
      const templateId = formData.get("templateId") as string;
      const category = formData.get("category") as Category;
      const enabled = formData.get("enabled") === "true";

      // 템플릿 정보 가져오기
      const { data: template, error: templateError } = await client
        .from("routine_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError || !template) {
        return { success: false, error: "템플릿을 찾을 수 없습니다." };
      }

      if (enabled) {
        // enabled=true: template_id로 기존 레코드 확인 (is_active 여부와 관계없이)
        const { data: existingOption } = await client
          .from("routine_grid_options")
          .select("id, is_active")
          .eq("user_id", userId)
          .eq("category", category)
          .eq("template_id", templateId)
          .maybeSingle();

        if (existingOption) {
          // 기존 레코드가 있으면 활성화 (이미 활성화되어 있어도 업데이트)
          const { error } = await client
            .from("routine_grid_options")
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
          const { error } = await client.from("routine_grid_options").insert({
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
          .from("routine_grid_options")
          .select("id")
          .eq("user_id", userId)
          .eq("category", category)
          .eq("template_id", templateId)
          .maybeSingle();

        if (existingOption) {
          const { error } = await client
            .from("routine_grid_options")
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

  const handleClearCategory = (category: Category) => {
    // 특정 카테고리의 "없음" 옵션 찾기
    const options = loaderData.optionsByCategory[category] ?? [];
    const noneOption = options.find((opt) => opt.label === "없음");

    if (!noneOption) return;

    const allowedTimeBlocks = CATEGORY_ALLOWED_TIME_BLOCKS[category];

    // 현재 해당 카테고리의 모든 셀이 "없음"인지 확인
    let allAreNone = true;
    for (const timeBlock of allowedTimeBlocks) {
      const cellKey = `${timeBlock}:${category}` as CellKey;
      const log = loaderData.valueMap[cellKey];

      // 셀이 없거나 option_id가 null이거나 "없음" 옵션이 아니면 allAreNone = false
      if (!log || !log.option_id || log.option_id !== noneOption.id) {
        allAreNone = false;
        break;
      }
    }

    // 토글: 모든 셀이 "없음"이면 미입력(null)으로, 아니면 "없음"으로 설정
    const shouldSetToNone = !allAreNone;

    // 모든 셀을 한 번에 처리
    const cells = allowedTimeBlocks.map((timeBlock) => ({
      time_block: timeBlock,
      category,
      option_id: shouldSetToNone ? noneOption.id : null,
      template_id: null,
    }));

    const formData = new FormData();
    formData.append("intent", "upsert-multiple-cells");
    formData.append("logDate", loaderData.logDate);
    formData.append("cells", JSON.stringify(cells));

    fetcher.submit(formData, { method: "post" });
  };

  const handleClearAll = () => {
    // "없음" 옵션 ID 수집
    const noneOptionIds = new Map<Category, string>();

    visibleCategories.forEach((category) => {
      const options = loaderData.optionsByCategory[category] ?? [];
      const noneOption = options.find((opt) => opt.label === "없음");
      if (noneOption) {
        noneOptionIds.set(category, noneOption.id);
      }
    });

    // 현재 모든 셀이 "없음"인지 확인
    let allAreNone = true;
    visibleCategories.forEach((category) => {
      const noneOptionId = noneOptionIds.get(category);
      if (!noneOptionId) {
        allAreNone = false;
        return;
      }

      const allowedTimeBlocks = CATEGORY_ALLOWED_TIME_BLOCKS[category];

      for (const timeBlock of allowedTimeBlocks) {
        const cellKey = `${timeBlock}:${category}` as CellKey;
        const log = loaderData.valueMap[cellKey];

        // 셀이 없거나 option_id가 null이거나 "없음" 옵션이 아니면 allAreNone = false
        if (!log || !log.option_id || log.option_id !== noneOptionId) {
          allAreNone = false;
          return;
        }
      }
    });

    // 모든 셀을 한 번에 처리
    const allCells: Array<{
      time_block: GridCellValue["time_block"];
      category: Category;
      option_id: string | null;
      template_id: string | null;
    }> = [];

    // 토글: 모든 셀이 "없음"이면 미입력(null)으로, 아니면 "없음"으로 설정
    const shouldSetToNone = !allAreNone;

    visibleCategories.forEach((category) => {
      const noneOptionId = noneOptionIds.get(category);
      if (!noneOptionId) return;

      const allowedTimeBlocks = CATEGORY_ALLOWED_TIME_BLOCKS[category];

      allowedTimeBlocks.forEach((timeBlock) => {
        allCells.push({
          time_block: timeBlock,
          category,
          option_id: shouldSetToNone ? noneOptionId : null,
          template_id: null,
        });
      });
    });

    if (allCells.length === 0) return;

    const formData = new FormData();
    formData.append("intent", "upsert-multiple-cells");
    formData.append("logDate", loaderData.logDate);
    formData.append("cells", JSON.stringify(allCells));

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
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleClearAll}
        >
          <X className="size-4" />
          전체 없음
        </Button>
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
        onClearCategory={handleClearCategory}
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
