/**
 * Health Report Request CTA
 *
 * Reusable button that opens a modal to collect minimal health info
 * and POSTs to n8n webhook. Redirects to login if not authenticated.
 */
import { CheckCircle2, FileText, Info, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useRouteLoaderData } from "react-router";
import { toast } from "sonner";

import { Button, type ButtonProps } from "~/core/components/ui/button";
import { Checkbox } from "~/core/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
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
  type HealthReportPayload,
  type TopConcern,
  type TreatmentStage,
  type WeeklyExerciseFreq,
  requestHealthReport,
} from "~/core/lib/health-report";

const TOP_CONCERN_LABELS: Record<TopConcern, string> = {
  fatigue: "피로",
  sleep: "수면",
  weight: "체중",
  stress_anxiety: "스트레스/불안",
  gut: "소화/장",
  exercise: "운동",
  metabolism: "대사",
  recurrence_worry: "재발 걱정",
  other: "기타",
};

const TREATMENT_STAGE_LABELS: Record<TreatmentStage, string> = {
  surveillance: "경과관찰",
  chemo: "항암치료",
  radiation: "방사선치료",
  post_treatment_1y: "치료 후 1년 이내",
  other: "기타",
};

const EXERCISE_LABELS: Record<WeeklyExerciseFreq, string> = {
  none: "없음",
  "1": "주 1회",
  "2-3": "주 2~3회",
  "4plus": "주 4회 이상",
};

const INFO_PATIENT_INPUT_PATH = "/my/dashboard/health";

function SelectItems<K extends string>({
  labels,
}: {
  labels: Record<K, string>;
}) {
  return (
    <>
      {(Object.entries(labels) as [K, string][]).map(([v, l]) => (
        <SelectItem key={v} value={v}>
          {l}
        </SelectItem>
      ))}
    </>
  );
}

interface HealthReportRequestButtonProps {
  variant?: ButtonProps["variant"];
  label?: string;
  sourceTag?: string;
  onSuccess?: () => void;
}

export function HealthReportRequestButton({
  variant = "default",
  label = "건강 리포트 요청",
  sourceTag = "cta",
  onSuccess,
}: HealthReportRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [treatmentStage, setTreatmentStage] = useState<TreatmentStage | "">("");
  const [topConcerns, setTopConcerns] = useState<TopConcern[]>([]);
  const [avgSleepHours, setAvgSleepHours] = useState("");
  const [weeklyExerciseFreq, setWeeklyExerciseFreq] = useState<
    WeeklyExerciseFreq | ""
  >("");
  const [medsOrSupps, setMedsOrSupps] = useState("");
  const [goal8weeks, setGoal8weeks] = useState("");

  const rootData = useRouteLoaderData("root") as {
    user?: { id: string } | null;
  } | null;
  const userId = rootData?.user?.id ?? null;
  const isLoggedIn = !!userId;
  const location = useLocation();
  const pagePath = location.pathname;

  const toggleConcern = (c: TopConcern) => {
    setTopConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c].slice(0, 2),
    );
  };

  const validate = (): string | null => {
    if (!treatmentStage) return "치료 단계를 선택해주세요.";
    if (topConcerns.length === 0) return "관심 항목을 1~2개 선택해주세요.";
    const sleep = parseFloat(avgSleepHours);
    if (Number.isNaN(sleep) || sleep < 0 || sleep > 24)
      return "평균 수면 시간을 0~24 사이 숫자로 입력해주세요.";
    if (!weeklyExerciseFreq) return "주간 운동 빈도를 선택해주세요.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!userId) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setSubmitting(true);
    const payload: HealthReportPayload = {
      treatment_stage: treatmentStage as TreatmentStage,
      top_concerns: topConcerns,
      avg_sleep_hours: parseFloat(avgSleepHours),
      weekly_exercise_freq: weeklyExerciseFreq as WeeklyExerciseFreq,
      meds_or_supps: medsOrSupps.trim() || undefined,
      goal_8weeks: goal8weeks.trim() || undefined,
      source: { page: pagePath, cta: sourceTag },
    };

    const result = await requestHealthReport(payload);
    setSubmitting(false);

    if (result.success) {
      setShowSuccess(true);
      resetFormState();
      onSuccess?.();
    } else {
      toast.error(result.error ?? "요청에 실패했습니다.");
    }
  };

  if (!isLoggedIn) {
    return (
      <Button variant={variant} asChild>
        <Link to="/login">건강 리포트 요청</Link>
      </Button>
    );
  }

  const resetFormState = () => {
    setTreatmentStage("");
    setTopConcerns([]);
    setAvgSleepHours("");
    setWeeklyExerciseFreq("");
    setMedsOrSupps("");
    setGoal8weeks("");
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) setShowSuccess(false);
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant={variant} className="gap-2">
          <FileText className="size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-500" />
                요청 완료
              </DialogTitle>
              <DialogDescription>
                건강 리포트 요청이 접수되었습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <p>
                OO님 맞춤 건강 리포트를 생성하고 있습니다. 총 예상 소요 시간:
                1~3시간.
              </p>
              <p className="text-muted-foreground text-sm">
                진행상태는 &quot;내 리포트&quot; 페이지에서 확인 가능합니다.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to="/my/dashboard/health/report">내 리포트 보기</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>건강 리포트 요청</DialogTitle>
              <DialogDescription>
                간단한 정보를 입력하면 맞춤 건강 리포트 초안을 만들어 드립니다.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 flex gap-3 rounded-lg border p-3 text-sm">
              <Info className="text-muted-foreground size-4 shrink-0" />
              <div className="space-y-2">
                <p>개인 맞춤 리포트를 위해 다음 정보 입력이 필요합니다:</p>
                <ul className="text-muted-foreground list-inside list-disc space-y-0.5 text-xs">
                  <li>환자 기본 정보 (나이, 성별, 질환 등)</li>
                  <li>혈액검사 정보</li>
                  <li>생활습관</li>
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  asChild
                >
                  <Link
                    to={INFO_PATIENT_INPUT_PATH}
                    onClick={() => setOpen(false)}
                  >
                    <UserPlus className="size-4" />
                    기본 정보 입력하러 가기
                  </Link>
                </Button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>치료 단계 *</Label>
                <Select
                  value={treatmentStage}
                  onValueChange={(v) => setTreatmentStage(v as TreatmentStage)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItems labels={TREATMENT_STAGE_LABELS} />
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>가장 관심 있는 항목 (1~2개) *</Label>
                <div className="flex flex-wrap gap-3">
                  {(
                    Object.entries(TOP_CONCERN_LABELS) as [TopConcern, string][]
                  ).map(([v, l]) => (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={topConcerns.includes(v)}
                        onCheckedChange={() => toggleConcern(v)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avg_sleep">평균 수면 시간 (시간) *</Label>
                <Input
                  id="avg_sleep"
                  type="number"
                  step={0.5}
                  min={0}
                  max={24}
                  placeholder="예: 5.5"
                  value={avgSleepHours}
                  onChange={(e) => setAvgSleepHours(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>주간 운동 빈도 *</Label>
                <Select
                  value={weeklyExerciseFreq}
                  onValueChange={(v) =>
                    setWeeklyExerciseFreq(v as WeeklyExerciseFreq)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItems labels={EXERCISE_LABELS} />
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meds">복용 중인 약/보충제 (선택)</Label>
                <Input
                  id="meds"
                  placeholder="예: 비타민D, 오메가3"
                  value={medsOrSupps}
                  onChange={(e) => setMedsOrSupps(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">8주 후 목표 (선택)</Label>
                <Input
                  id="goal"
                  placeholder="예: 수면 7시간 확보"
                  value={goal8weeks}
                  onChange={(e) => setGoal8weeks(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "요청 중..." : "요청하기"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
