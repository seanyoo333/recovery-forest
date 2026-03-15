/**
 * Health Report Request CTA
 *
 * Reusable button that opens a modal to collect minimal health info
 * and POSTs to n8n webhook. Redirects to login if not authenticated.
 */
import { CheckCircle2, Coins, FileText, Info, UserPlus } from "lucide-react";
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
  HEALTH_REPORT_PAGE_PATH,
  HEALTH_REPORT_PENDING_KEY,
  HEALTH_REPORT_POINT_PRICE,
  type TopConcern,
  type TreatmentStage,
  type WeeklyExerciseFreq,
  requestHealthReport,
} from "~/core/lib/health-report";
import { getCheckoutUrl } from "~/core/lib/payment-constants";

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
  const [cancerType, setCancerType] = useState("");
  const [topConcerns, setTopConcerns] = useState<TopConcern[]>([]);
  const [avgSleepHours, setAvgSleepHours] = useState("");
  const [weeklyExerciseFreq, setWeeklyExerciseFreq] = useState<
    WeeklyExerciseFreq | ""
  >("");
  const [medsOrSupps, setMedsOrSupps] = useState("");
  const [goal8weeks, setGoal8weeks] = useState("");
  const [consentSensitive, setConsentSensitive] = useState(false);
  const [consentOverseas, setConsentOverseas] = useState(false);
  const [consentAiNotice, setConsentAiNotice] = useState(false);
  const [consentMedicalDisclaimer, setConsentMedicalDisclaimer] = useState(false);

  const allConsentChecked =
    consentSensitive && consentOverseas && consentAiNotice && consentMedicalDisclaimer;
  const handleAgreeAllConsent = (checked: boolean) => {
    setConsentSensitive(checked);
    setConsentOverseas(checked);
    setConsentAiNotice(checked);
    setConsentMedicalDisclaimer(checked);
  };

  const rootData = useRouteLoaderData("root") as {
    user?: { id: string } | null;
    userPoints?: number;
  } | null;
  const userId = rootData?.user?.id ?? null;
  const userPoints = rootData?.userPoints ?? 0;
  const isLoggedIn = !!userId;
  const hasEnoughPoints = userPoints >= HEALTH_REPORT_POINT_PRICE;
  const location = useLocation();
  const pagePath = location.pathname;

  const toggleConcern = (c: TopConcern) => {
    setTopConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c].slice(0, 2),
    );
  };

  const validate = (): string | null => {
    if (!consentSensitive || !consentOverseas || !consentAiNotice || !consentMedicalDisclaimer) {
      return "모든 필수 동의 항목에 체크해 주세요.";
    }
    if (!treatmentStage) return "치료 단계를 선택해주세요.";
    if (topConcerns.length === 0) return "관심 항목을 1~2개 선택해주세요.";
    const sleep = parseFloat(avgSleepHours);
    if (Number.isNaN(sleep) || sleep < 0 || sleep > 24)
      return "평균 수면 시간을 0~24 사이 숫자로 입력해주세요.";
    if (!weeklyExerciseFreq) return "주간 운동 빈도를 선택해주세요.";
    return null;
  };

  const buildPayload = (): HealthReportPayload => ({
    treatment_stage: treatmentStage as TreatmentStage,
    cancer_type: cancerType.trim() || undefined,
    top_concerns: topConcerns,
    avg_sleep_hours: parseFloat(avgSleepHours),
    weekly_exercise_freq: weeklyExerciseFreq as WeeklyExerciseFreq,
    meds_or_supps: medsOrSupps.trim() || undefined,
    goal_8weeks: goal8weeks.trim() || undefined,
    source: { page: pagePath, cta: sourceTag },
  });

  const handleSubmitPointPayment = async (e: React.FormEvent) => {
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
    if (!hasEnoughPoints) {
      toast.error(`포인트가 부족합니다. (필요: ${HEALTH_REPORT_POINT_PRICE.toLocaleString()}P)`);
      return;
    }

    setSubmitting(true);
    const result = await requestHealthReport(buildPayload());
    setSubmitting(false);

    if (result.success) {
      setShowSuccess(true);
      resetFormState();
      onSuccess?.();
    } else {
      toast.error(result.error ?? "요청에 실패했습니다.");
    }
  };

  const handleCardPayment = (e: React.MouseEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      sessionStorage.setItem(
        HEALTH_REPORT_PENDING_KEY,
        JSON.stringify(buildPayload()),
      );
      window.location.href = getCheckoutUrl("health_report");
    } catch {
      toast.error("결제 페이지로 이동할 수 없습니다.");
    }
  };

  if (!isLoggedIn) {
    return (
      <Button variant={variant} asChild>
        <Link to="/login">건강 보고서 요청</Link>
      </Button>
    );
  }

  const resetFormState = () => {
    setConsentSensitive(false);
    setConsentOverseas(false);
    setConsentAiNotice(false);
    setConsentMedicalDisclaimer(false);
    setTreatmentStage("");
    setCancerType("");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-500" />
                요청 접수
              </DialogTitle>
              <DialogDescription>
                건강 리포트 요청이 접수되었습니다. 진행상태는 내 리포트
                페이지에서 확인하실 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">
              <Button asChild className="w-full">
                <Link to={HEALTH_REPORT_PAGE_PATH}>내 보고서 보기</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>건강 보고서 요청</DialogTitle>
              <DialogDescription>
                지피지기면 백전불태. 건강한 삶을 위한 건강 전략 지도.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="text-muted-foreground size-4" />
                <span className="font-medium">보유 포인트</span>
                <span className={hasEnoughPoints ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                  {userPoints.toLocaleString()}P
                </span>
                <span className="text-muted-foreground text-xs">
                  (필요: {HEALTH_REPORT_POINT_PRICE.toLocaleString()}P)
                </span>
              </div>
              {!hasEnoughPoints && (
                <Button variant="default" size="sm" asChild>
                  <Link
                    to={getCheckoutUrl("point")}
                    onClick={() => setOpen(false)}
                  >
                    포인트 충전
                  </Link>
                </Button>
              )}
            </div>
            <div className="bg-muted/50 flex gap-3 rounded-lg border p-3 text-sm">
              <Info className="text-muted-foreground size-4 shrink-0" />
              <div className="space-y-2">
                <p className="font-medium">
                  기본 정보가 부족하면 리포트 내용이 제한될 수 있습니다.
                </p>
                <p className="text-muted-foreground text-xs">
                  환자 프로필, 혈액검사, 생활습관 등이 충분히 입력되어 있을수록 맞춤형 리포트 품질이 높아집니다.
                </p>
                <p>개인 맞춤 리포트를 위해 다음 정보 입력이 필요합니다:</p>
                <ul className="text-muted-foreground list-inside list-disc space-y-0.5 text-xs">
                  <li>환자 기본 정보 (나이, 성별, 질환 등)</li>
                  <li>혈액검사 정보</li>
                  <li>생활습관 기록</li>
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
            <form onSubmit={handleSubmitPointPayment} className="space-y-4">
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex items-start gap-2 rounded-md border border-amber-400/50 bg-amber-100/50 p-2 dark:border-amber-600 dark:bg-amber-900/30">
                  <Checkbox
                    id="agreeAllConsent"
                    checked={allConsentChecked}
                    onCheckedChange={(v) => handleAgreeAllConsent(!!v)}
                  />
                  <label htmlFor="agreeAllConsent" className="cursor-pointer text-sm font-medium">
                    전체 동의
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">[필수] 아래 항목에 모두 동의해 주세요.</p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <Checkbox
                      checked={consentSensitive}
                      onCheckedChange={(v) => setConsentSensitive(!!v)}
                    />
                    <span>건강정보(민감정보) 수집·이용에 동의합니다.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <Checkbox
                      checked={consentOverseas}
                      onCheckedChange={(v) => setConsentOverseas(!!v)}
                    />
                    <span>개인정보의 국외 이전에 동의합니다.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <Checkbox
                      checked={consentAiNotice}
                      onCheckedChange={(v) => setConsentAiNotice(!!v)}
                    />
                    <span>AI 분석 및 자동화된 처리 안내를 확인했습니다.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <Checkbox
                      checked={consentMedicalDisclaimer}
                      onCheckedChange={(v) => setConsentMedicalDisclaimer(!!v)}
                    />
                    <span>본 서비스는 의료행위가 아니며, 진단·처방을 대체하지 않음을 이해했습니다.</span>
                  </label>
                </div>
              </div>

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
                <Label htmlFor="cancer_type">암종 (선택)</Label>
                <Input
                  id="cancer_type"
                  placeholder="예: 유방암, 대장암"
                  value={cancerType}
                  onChange={(e) => setCancerType(e.target.value)}
                />
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCardPayment}
                  disabled={submitting}
                >
                  카드로 결제 ({HEALTH_REPORT_POINT_PRICE.toLocaleString()}원)
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !hasEnoughPoints}
                  title={
                    !hasEnoughPoints
                      ? `포인트가 부족합니다. (필요: ${HEALTH_REPORT_POINT_PRICE.toLocaleString()}P)`
                      : undefined
                  }
                >
                  {submitting ? "요청 중..." : "포인트로 요청"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
