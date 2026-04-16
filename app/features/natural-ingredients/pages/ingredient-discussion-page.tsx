import type { Route } from "./+types/ingredient-discussion-page";

import { EditIcon, MessageCircleIcon, Trash2Icon } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Form, Link, useNavigation, useOutletContext } from "react-router";
import { z } from "zod";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  ExperienceReply,
  type ExperienceReplyNode,
} from "../components/experience-reply";
import { getIngredientBySlug } from "../queries";

type UsageGoalValue =
  | "metabolic_stability"
  | "immune_balance"
  | "abnormal_signals"
  | "neuro_stress_intervention"
  | "recovery"
  | "other";

interface ExperienceItem {
  id: number;
  profileId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  createdAt: string;
  content: string;
  usageGoal: string;
  usageGoalOther: string | null;
  duration: string;
  formFactor: string;
  summary: string;
  replies: ExperienceReplyNode[];
}

const USAGE_GOAL_OPTIONS: Array<{ value: UsageGoalValue; label: string }> = [
  { value: "metabolic_stability", label: "대사안정화 (metabolic_stability)" },
  { value: "immune_balance", label: "면역 균형 (immune_balance)" },
  { value: "abnormal_signals", label: "비정상 신호조절 (abnormal_signals)" },
  {
    value: "neuro_stress_intervention",
    label: "신경 스트레스 개입 (neuro-stress intervention)",
  },
  { value: "recovery", label: "회복증진 (recovery)" },
  { value: "other", label: "기타" },
];

function toNullable(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function usageGoalLabel(goal: string | null, other: string | null): string {
  if (!goal) return "사용 목적 미입력";
  const map: Record<string, string> = {
    metabolic_stability: "대사안정화",
    immune_balance: "면역 균형",
    abnormal_signals: "비정상 신호조절",
    neuro_stress_intervention: "신경 스트레스 개입",
    recovery: "회복증진",
    other: "기타",
  };
  if (goal === "other") {
    return other?.trim() ? `기타: ${other.trim()}` : "기타";
  }
  return map[goal] ?? goal;
}

function countReplies(replies: ExperienceReplyNode[]): number {
  return replies.reduce((acc, cur) => acc + 1 + countReplies(cur.replies), 0);
}

const experienceFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "경험 내용은 10자 이상 입력해 주세요.")
    .max(400, "경험 내용은 400자 이하로 입력해 주세요."),
  usage_goal: z
    .enum(
      [
        "metabolic_stability",
        "immune_balance",
        "abnormal_signals",
        "neuro_stress_intervention",
        "recovery",
        "other",
      ],
      { errorMap: () => ({ message: "유효한 사용 목적을 선택해 주세요." }) },
    )
    .optional()
    .nullable(),
  usage_goal_other: z.string().trim().max(80).optional().nullable(),
  duration_label: z.string().trim().max(30).optional().nullable(),
  form_factor: z.string().trim().max(30).optional().nullable(),
  summary_label: z.string().trim().max(30).optional().nullable(),
});

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs & { params: { slug: string } }) => {
  const [client] = makeServerClient(request);
  const ingredient = await getIngredientBySlug(client, { slug: params.slug });
  if (!ingredient) throw new Response("Not Found", { status: 404 });

  const { data: experienceRows, error } = await (client as any)
    .from("ingredient_experiences")
    .select(
      `
      content,
      usage_goal,
      usage_goal_other,
      duration_label,
      form_factor,
      summary_label,
      created_at,
      experience_id,
      profile_id,
      user:profiles!inner(
        name,
        username,
        avatar
      )
    `,
    )
    .eq("ingredient_id", ingredient.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const experienceIds = (experienceRows ?? []).map((row: any) => row.experience_id);
  const repliesByExperienceId = new Map<number, ExperienceReplyNode[]>();
  if (experienceIds.length > 0) {
    const { data: replyRows, error: replyError } = await (client as any)
      .from("ingredient_experience_replies")
      .select(
        `
        experience_reply_id,
        experience_id,
        parent_id,
        reply,
        created_at,
        user:profiles!inner(
          name,
          username,
          avatar
        )
      `,
      )
      .in("experience_id", experienceIds)
      .order("created_at", { ascending: true });
    if (replyError) throw replyError;

    const flatByExperienceId = new Map<
      number,
      Array<ExperienceReplyNode & { parentId: number | null }>
    >();
    for (const row of replyRows ?? []) {
      const mapped: ExperienceReplyNode = {
        id: row.experience_reply_id,
        experienceId: row.experience_id,
        parentId: row.parent_id ?? null,
        authorName: row.user?.name ?? "익명 사용자",
        authorUsername: row.user?.username ?? "unknown",
        authorAvatar: row.user?.avatar ?? null,
        content: row.reply ?? "",
        createdAt: row.created_at,
        replies: [],
      };
      const prev = flatByExperienceId.get(row.experience_id) ?? [];
      prev.push(mapped);
      flatByExperienceId.set(row.experience_id, prev);
    }

    for (const [experienceId, flatReplies] of flatByExperienceId.entries()) {
      const byId = new Map<number, ExperienceReplyNode>();
      const roots: ExperienceReplyNode[] = [];
      for (const reply of flatReplies) {
        byId.set(reply.id, { ...reply, replies: [] });
      }
      for (const reply of flatReplies) {
        const node = byId.get(reply.id)!;
        if (reply.parentId && byId.has(reply.parentId)) {
          byId.get(reply.parentId)!.replies.push(node);
        } else {
          roots.push(node);
        }
      }
      repliesByExperienceId.set(experienceId, roots);
    }
  }

  const experiences: ExperienceItem[] = (experienceRows ?? []).map((row: any) => ({
    id: row.experience_id,
    profileId: row.profile_id,
    authorName: row.user?.name ?? "익명 사용자",
    authorUsername: row.user?.username ?? "unknown",
    authorAvatar: row.user?.avatar ?? null,
    createdAt: row.created_at,
    content: row.content ?? "",
    usageGoal: row.usage_goal ?? "",
    usageGoalOther: row.usage_goal_other ?? null,
    duration: row.duration_label ?? "",
    formFactor: row.form_factor ?? "",
    summary: row.summary_label ?? "",
    replies: repliesByExperienceId.get(row.experience_id) ?? [],
  }));

  return {
    ingredientName: ingredient.display_name,
    experiences,
  };
};

export const action = async ({
  request,
  params,
}: Route.ActionArgs & { params: { slug: string } }) => {
  const [client] = makeServerClient(request);
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  const userId = user?.id;
  if (userError || !userId) {
    return {
      formError: "로그인 후 경험을 공유할 수 있습니다.",
    };
  }

  const ingredient = await getIngredientBySlug(client, { slug: params.slug });
  if (!ingredient) throw new Response("Not Found", { status: 404 });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-reply") {
    const reply = toNullable(formData.get("reply"));
    const experienceIdRaw = formData.get("experience_id");
    const parentReplyIdRaw = formData.get("parent_reply_id");
    const experienceId =
      typeof experienceIdRaw === "string" ? Number(experienceIdRaw) : NaN;
    const parentReplyId =
      typeof parentReplyIdRaw === "string" && parentReplyIdRaw.trim().length > 0
        ? Number(parentReplyIdRaw)
        : null;
    if (!reply || Number.isNaN(experienceId)) {
      return {
        formError: "댓글 내용을 입력해 주세요.",
      };
    }
    const { error: replyError } = await (client as any)
      .from("ingredient_experience_replies")
      .insert({
        experience_id: experienceId,
        parent_id: Number.isNaN(parentReplyId as number) ? null : parentReplyId,
        profile_id: userId,
        reply,
      });
    if (replyError) {
      return {
        formError: "댓글 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    return { ok: true, intent: "create-reply" };
  }

  if (intent === "delete-reply") {
    const replyIdRaw = formData.get("reply_id");
    const replyId = typeof replyIdRaw === "string" ? Number(replyIdRaw) : NaN;
    if (Number.isNaN(replyId)) {
      return { formError: "삭제할 댓글 정보를 찾을 수 없습니다." };
    }

    const { data: targetReply, error: replyFetchError } = await (client as any)
      .from("ingredient_experience_replies")
      .select("profile_id")
      .eq("experience_reply_id", replyId)
      .maybeSingle();
    if (replyFetchError || !targetReply) {
      return { formError: "댓글을 찾을 수 없습니다." };
    }
    if (targetReply.profile_id !== userId) {
      return { formError: "댓글을 삭제할 권한이 없습니다." };
    }

    const { error: deleteError } = await (client as any)
      .from("ingredient_experience_replies")
      .delete()
      .eq("experience_reply_id", replyId);
    if (deleteError) {
      return { formError: "댓글 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }

    return { ok: true, intent: "delete-reply" };
  }

  if (intent === "delete-experience") {
    const experienceIdRaw = formData.get("experience_id");
    const experienceId =
      typeof experienceIdRaw === "string" ? Number(experienceIdRaw) : NaN;
    if (Number.isNaN(experienceId)) {
      return { formError: "삭제할 경험 정보를 찾을 수 없습니다." };
    }

    const { data: targetExperience, error: fetchError } = await (client as any)
      .from("ingredient_experiences")
      .select("profile_id")
      .eq("experience_id", experienceId)
      .maybeSingle();
    if (fetchError || !targetExperience) {
      return { formError: "경험 글을 찾을 수 없습니다." };
    }
    if (targetExperience.profile_id !== userId) {
      return { formError: "경험 글을 삭제할 권한이 없습니다." };
    }

    const { error: deleteError } = await (client as any)
      .from("ingredient_experiences")
      .delete()
      .eq("experience_id", experienceId);
    if (deleteError) {
      return { formError: "경험 글 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }

    return { ok: true, intent: "delete-experience" };
  }

  if (intent === "update-experience") {
    const experienceIdRaw = formData.get("experience_id");
    const experienceId =
      typeof experienceIdRaw === "string" ? Number(experienceIdRaw) : NaN;
    if (Number.isNaN(experienceId)) {
      return { formError: "수정할 경험 정보를 찾을 수 없습니다." };
    }

    const { data: targetExperience, error: fetchError } = await (client as any)
      .from("ingredient_experiences")
      .select("profile_id")
      .eq("experience_id", experienceId)
      .maybeSingle();
    if (fetchError || !targetExperience) {
      return { formError: "경험 글을 찾을 수 없습니다." };
    }
    if (targetExperience.profile_id !== userId) {
      return { formError: "경험 글을 수정할 권한이 없습니다." };
    }

    const parsedUpdate = experienceFormSchema.safeParse({
      content: toNullable(formData.get("content")) ?? "",
      usage_goal: toNullable(formData.get("usage_goal")),
      usage_goal_other: toNullable(formData.get("usage_goal_other")),
      duration_label: toNullable(formData.get("duration_label")),
      form_factor: toNullable(formData.get("form_factor")),
      summary_label: toNullable(formData.get("summary_label")),
    });
    if (!parsedUpdate.success) {
      return { formError: "수정 내용을 확인해 주세요." };
    }
    if (
      parsedUpdate.data.usage_goal === "other" &&
      !parsedUpdate.data.usage_goal_other
    ) {
      return { formError: "기타를 선택한 경우 상세 목적을 입력해 주세요." };
    }

    const { error: updateError } = await (client as any)
      .from("ingredient_experiences")
      .update({
        content: parsedUpdate.data.content,
        usage_goal: parsedUpdate.data.usage_goal ?? null,
        usage_goal_other:
          parsedUpdate.data.usage_goal === "other"
            ? (parsedUpdate.data.usage_goal_other ?? null)
            : null,
        duration_label: parsedUpdate.data.duration_label,
        form_factor: parsedUpdate.data.form_factor,
        summary_label: parsedUpdate.data.summary_label,
      })
      .eq("experience_id", experienceId);
    if (updateError) {
      return { formError: "경험 글 수정에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }

    return { ok: true, intent: "update-experience" };
  }

  const parsed = experienceFormSchema.safeParse({
    content: toNullable(formData.get("content")) ?? "",
    usage_goal: toNullable(formData.get("usage_goal")),
    usage_goal_other: toNullable(formData.get("usage_goal_other")),
    duration_label: toNullable(formData.get("duration_label")),
    form_factor: toNullable(formData.get("form_factor")),
    summary_label: toNullable(formData.get("summary_label")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.usage_goal === "other" && !parsed.data.usage_goal_other) {
    return {
      fieldErrors: {
        usage_goal_other: ["기타를 선택한 경우 상세 목적을 입력해 주세요."],
      },
    };
  }

  const { error } = await (client as any).from("ingredient_experiences").insert({
    ingredient_id: ingredient.id,
    profile_id: userId,
    content: parsed.data.content,
    usage_goal: parsed.data.usage_goal ?? null,
    usage_goal_other:
      parsed.data.usage_goal === "other"
        ? (parsed.data.usage_goal_other ?? null)
        : null,
    duration_label: parsed.data.duration_label,
    form_factor: parsed.data.form_factor,
    summary_label: parsed.data.summary_label,
  });
  if (error) {
    return {
      formError:
        "경험 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true, intent: "create-experience" };
};

export default function IngredientDiscussionPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const context = useOutletContext<{
    isLoggedIn: boolean;
    username?: string;
    profileId?: string;
  }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isLoggedIn = context?.isLoggedIn ?? false;
  const currentUserId = context?.profileId ?? null;
  const currentUsername = context?.username;
  const [content, setContent] = useState("");
  const [usageGoal, setUsageGoal] = useState("");
  const [usageGoalOther, setUsageGoalOther] = useState("");
  const [duration, setDuration] = useState("");
  const [formFactor, setFormFactor] = useState("");
  const [summary, setSummary] = useState("");
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null);
  const [deleteConfirmExperienceId, setDeleteConfirmExperienceId] = useState<number | null>(
    null,
  );
  const experiences = loaderData.experiences;

  useEffect(() => {
    if (actionData?.ok && actionData?.intent === "create-experience") {
      setContent("");
      setUsageGoal("");
      setUsageGoalOther("");
      setDuration("");
      setFormFactor("");
      setSummary("");
    }
    if (actionData?.ok) {
      setEditingExperienceId(null);
      setDeleteConfirmExperienceId(null);
    }
  }, [actionData?.ok, actionData?.intent]);

  return (
    <div className="mx-auto max-w-screen-lg space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">사용 경험</h2>
          <p className="text-muted-foreground text-sm">
            "{loaderData.ingredientName}" 관련 사용 경험을 간단한 댓글 형태로 확인하고
            공유해 보세요.
          </p>
        </div>
      </div>

      <Form method="post">
        <Card className="space-y-0">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">경험 공유</CardTitle>
          <p className="text-muted-foreground text-sm">
            개인 경험은 참고 정보입니다. 치료 또는 복용 결정은 의료진과 상의해 주세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="experience-content">경험 내용</Label>
            <Textarea
              id="experience-content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={400}
              placeholder="어떤 상황에서 사용했고, 어떤 점이 도움이 되었는지 간단히 공유해 주세요."
            />
            <p className="text-muted-foreground text-xs">{content.length}/400</p>
            {actionData?.fieldErrors?.content ? (
              <p className="text-sm text-red-500">
                {actionData.fieldErrors.content.join(", ")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>사용 목적</Label>
              <select
                name="usage_goal"
                value={usageGoal}
                onChange={(e) => setUsageGoal(e.target.value)}
                className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">선택 안 함</option>
                {USAGE_GOAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {actionData?.fieldErrors?.usage_goal ? (
                <p className="text-sm text-red-500">
                  {actionData.fieldErrors.usage_goal.join(", ")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>사용 기간</Label>
              <select
                name="duration_label"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">선택 안 함</option>
                <option value="1주 미만">1주 미만</option>
                <option value="1~4주">1~4주</option>
                <option value="1~3개월">1~3개월</option>
                <option value="3개월 이상">3개월 이상</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>제품 형태</Label>
              <select
                name="form_factor"
                value={formFactor}
                onChange={(e) => setFormFactor(e.target.value)}
                className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">선택 안 함</option>
                <option value="캡슐">캡슐</option>
                <option value="정제">정제</option>
                <option value="분말">분말</option>
                <option value="액상">액상</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>한 줄 요약</Label>
              <select
                name="summary_label"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">선택 안 함</option>
                <option value="도움됨">도움됨</option>
                <option value="잘 모르겠음">잘 모르겠음</option>
                <option value="나와는 안 맞음">나와는 안 맞음</option>
              </select>
            </div>
          </div>

          {usageGoal === "other" ? (
            <div className="space-y-2">
              <Label htmlFor="usage-goal-other">기타 사용 목적</Label>
              <Textarea
                id="usage-goal-other"
                name="usage_goal_other"
                value={usageGoalOther}
                onChange={(e) => setUsageGoalOther(e.target.value)}
                className="min-h-[72px]"
                maxLength={80}
                placeholder="기타 사용 목적을 입력해 주세요."
              />
              {actionData?.fieldErrors?.usage_goal_other ? (
                <p className="text-sm text-red-500">
                  {actionData.fieldErrors.usage_goal_other.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}

          {actionData?.formError ? (
            <p className="text-sm text-red-500">{actionData.formError}</p>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            {!isLoggedIn ? (
              <p className="text-muted-foreground text-sm">
                로그인하면 경험을 작성할 수 있습니다.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                1인당 성분별 작성 횟수 제한 없이 자유롭게 공유할 수 있습니다.
              </p>
            )}
            <Button
              type="submit"
              name="intent"
              value="create-experience"
              disabled={!isLoggedIn || isSubmitting}
            >
              {isSubmitting ? "저장 중..." : "경험 공유"}
            </Button>
          </div>
        </CardContent>
        </Card>
      </Form>

      {experiences.length === 0 ? (
        <div className="rounded-xl border p-6">
          <p className="text-muted-foreground">
            아직 등록된 사용 경험이 없습니다. 첫 경험을 공유해 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{item.authorName.charAt(0)}</AvatarFallback>
                      {item.authorAvatar ? <AvatarImage src={item.authorAvatar} /> : null}
                    </Avatar>
                    <div>
                      <p className="font-medium">{item.authorName}</p>
                      <p className="text-muted-foreground text-xs">
                        @{item.authorUsername}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {DateTime.fromISO(item.createdAt, {
                      zone: "Asia/Seoul",
                    }).toRelative()}
                  </span>
                </div>
                {currentUserId && currentUserId === item.profileId ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingExperienceId((prev) =>
                          prev === item.id ? null : item.id,
                        )
                      }
                    >
                      <EditIcon className="size-4" />
                      수정
                    </Button>
                    <Form method="post">
                      <input type="hidden" name="intent" value="delete-experience" />
                      <input type="hidden" name="experience_id" value={item.id} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          if (deleteConfirmExperienceId !== item.id) {
                            e.preventDefault();
                            setDeleteConfirmExperienceId(item.id);
                          }
                        }}
                      >
                        <Trash2Icon className="size-4" />
                        {deleteConfirmExperienceId === item.id
                          ? "정말 삭제하시겠습니까?"
                          : "삭제"}
                      </Button>
                    </Form>
                  </div>
                ) : null}

                {editingExperienceId === item.id ? (
                  <Form method="post" className="space-y-3 rounded-md border p-3">
                    <input type="hidden" name="intent" value="update-experience" />
                    <input type="hidden" name="experience_id" value={item.id} />
                    <div className="space-y-2">
                      <Label>경험 내용</Label>
                      <Textarea
                        name="content"
                        defaultValue={item.content}
                        className="min-h-[96px]"
                      />
                    </div>
                    <div className="grid gap-2 md:grid-cols-4">
                      <select
                        name="usage_goal"
                        defaultValue={item.usageGoal || ""}
                        className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">선택 안 함</option>
                        {USAGE_GOAL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        name="duration_label"
                        defaultValue={item.duration || ""}
                        className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">선택 안 함</option>
                        <option value="1주 미만">1주 미만</option>
                        <option value="1~4주">1~4주</option>
                        <option value="1~3개월">1~3개월</option>
                        <option value="3개월 이상">3개월 이상</option>
                      </select>
                      <select
                        name="form_factor"
                        defaultValue={item.formFactor || ""}
                        className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">선택 안 함</option>
                        <option value="캡슐">캡슐</option>
                        <option value="정제">정제</option>
                        <option value="분말">분말</option>
                        <option value="액상">액상</option>
                        <option value="기타">기타</option>
                      </select>
                      <select
                        name="summary_label"
                        defaultValue={item.summary || ""}
                        className="border-input bg-background ring-offset-background w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">선택 안 함</option>
                        <option value="도움됨">도움됨</option>
                        <option value="잘 모르겠음">잘 모르겠음</option>
                        <option value="나와는 안 맞음">나와는 안 맞음</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>기타 사용 목적</Label>
                      <Textarea
                        name="usage_goal_other"
                        defaultValue={
                          item.usageGoal === "other" ? (item.usageGoalOther ?? "") : ""
                        }
                        className="min-h-[64px]"
                        placeholder="사용 목적에서 기타를 선택한 경우 입력해 주세요."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingExperienceId(null)}
                      >
                        취소
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        저장
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {usageGoalLabel(item.usageGoal, item.usageGoalOther)}
                      </Badge>
                      {item.duration ? (
                        <Badge variant="secondary">{item.duration}</Badge>
                      ) : null}
                      {item.formFactor ? (
                        <Badge variant="secondary">{item.formFactor}</Badge>
                      ) : null}
                      {item.summary ? (
                        <Badge variant="outline">{item.summary}</Badge>
                      ) : null}
                    </div>
                  </>
                )}

                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">
                    댓글 {countReplies(item.replies)}개
                  </h4>

                  {item.replies.length > 0 ? (
                    <div className="space-y-4">
                      {item.replies.map((reply) => (
                        <ExperienceReply
                          key={reply.id}
                          reply={reply}
                          topLevel
                          isLoggedIn={isLoggedIn}
                          currentUsername={currentUsername}
                          actionData={actionData}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      아직 댓글이 없습니다.
                    </p>
                  )}

                  {isLoggedIn ? (
                    <Form method="post" className="space-y-3">
                      <input type="hidden" name="intent" value="create-reply" />
                      <input
                        type="hidden"
                        name="experience_id"
                        value={item.id}
                      />
                      <Textarea
                        name="reply"
                        className="min-h-[72px]"
                        maxLength={300}
                        placeholder="댓글을 남겨 보세요."
                      />
                      <div className="flex justify-end">
                        <Button size="sm" disabled={isSubmitting}>
                          <MessageCircleIcon className="size-4" />
                          댓글 달기
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      로그인하면 댓글을 작성할 수 있습니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to={`/community?keyword=${encodeURIComponent(loaderData.ingredientName)}`}>
            커뮤니티 토론 보기
          </Link>
        </Button>
      </div>
    </div>
  );
}
