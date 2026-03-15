import type { ReactNode } from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import { Badge } from "~/core/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Separator } from "~/core/components/ui/separator";

type Tone = "stable" | "caution" | "focus";
type ConfidenceLevel = "low" | "medium" | "high";
type BadgeTone = "default" | "success" | "warning" | "danger" | "info";

type SectionCardProps = {
  step?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

type ReportCoverProps = {
  title: string;
  subtitle?: string;
  reportType?: string;
  createdAt?: string;
  patientName?: string;
  brandName?: string;
  disclaimer?: string;
};

type ReportHeroSummaryProps = {
  headline: string;
  summary: string;
  keyPoints?: string[];
  tone?: Tone;
};

type InsightPanelProps = {
  title: string;
  content: string;
  takeaway?: string;
  variant?: "default" | "clinical" | "routine";
};

type PriorityTargetCardProps = {
  symptoms: string[];
  targets: string[];
  axis: string;
  explanation: string;
  habitPriorities?: string[];
};

type EvidenceBridgeProps = {
  relationTitle: string;
  relationContent: string;
  paperSummaryTitle: string;
  paperSummary: string;
  relevanceTitle: string;
  relevanceContent: string;
  extraEvidenceTitle?: string;
  extraEvidenceContent?: string;
};

type ActionTimelineProps = {
  goalTitle: string;
  goalContent: string;
  firstWeekTitle: string;
  firstWeekContent: string;
  eightWeekTitle: string;
  eightWeekContent: string;
  firstWeekChecklist?: string[];
  eightWeekChecklist?: string[];
};

type DoctorQuestionBoxProps = {
  title?: string;
  intro?: string;
  questions: string[];
};

type WarningPanelProps = {
  title?: string;
  items: string[];
  emergencyNote?: string;
};

type ReportClosingProps = {
  message: string;
  nextStepTitle?: string;
  nextStepItems?: string[];
};

type ScoreBadgeProps = {
  label: string;
  value?: string | number;
  tone?: BadgeTone;
};

type StatusChipProps = {
  label: string;
  tone?: BadgeTone;
};

type DataConfidenceBoxProps = {
  level: ConfidenceLevel;
  message: string;
  recommendation?: string;
};

type EvidenceLevelTagProps = {
  label: string;
};

type RoutineChecklistProps = {
  title?: string;
  items: string[];
};

type ReportFooterMetaProps = {
  createdAt?: string;
  version?: string;
  contactEmail?: string;
  medicalDisclaimer?: string;
  aiNotice?: string;
};

function getToneClasses(tone: Tone) {
  switch (tone) {
    case "stable":
      return {
        wrap:
          "border-emerald-200/60 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20",
        title: "text-emerald-700 dark:text-emerald-300",
      };
    case "caution":
      return {
        wrap:
          "border-amber-200/60 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20",
        title: "text-amber-700 dark:text-amber-300",
      };
    case "focus":
    default:
      return {
        wrap:
          "border-indigo-200/60 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/20",
        title: "text-indigo-700 dark:text-indigo-300",
      };
  }
}

function getBadgeClasses(tone: BadgeTone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300";
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300";
    case "info":
      return "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-300";
    case "default":
    default:
      return "border-border bg-background text-foreground";
  }
}

function getConfidenceClasses(level: ConfidenceLevel) {
  switch (level) {
    case "high":
      return {
        wrap:
          "border-emerald-200/60 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20",
        title: "text-emerald-700 dark:text-emerald-300",
        label: "해석 신뢰도 높음",
      };
    case "medium":
      return {
        wrap:
          "border-sky-200/60 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/20",
        title: "text-sky-700 dark:text-sky-300",
        label: "해석 신뢰도 보통",
      };
    case "low":
    default:
      return {
        wrap:
          "border-amber-200/60 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20",
        title: "text-amber-700 dark:text-amber-300",
        label: "해석 신뢰도 낮음",
      };
  }
}

export function ReportCover({
  title,
  subtitle,
  reportType = "개인 맞춤 건강 전략 리포트",
  createdAt,
  patientName,
  brandName = "Evidence Base",
  disclaimer = "본 리포트는 참고용 건강정보이며, 의료행위·진단·처방을 대체하지 않습니다.",
}: ReportCoverProps) {
  return (
    <section className="rounded-2xl border bg-background px-6 py-8 shadow-sm sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs uppercase tracking-wide">
          {reportType}
        </Badge>
        {patientName ? (
          <Badge className="text-xs" variant="secondary">
            {patientName}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          {brandName}
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground max-w-3xl text-base leading-7 sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 border-t pt-6 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <p className="font-medium text-foreground">리포트 정보</p>
          <p className="mt-1">생성일: {createdAt ?? "-"}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">중요 안내</p>
          <p className="mt-1 leading-6">{disclaimer}</p>
        </div>
      </div>
    </section>
  );
}

export function ReportHeroSummary({
  headline,
  summary,
  keyPoints = [],
  tone = "focus",
}: ReportHeroSummaryProps) {
  const styles = getToneClasses(tone);

  return (
    <section className={`rounded-2xl border px-6 py-6 shadow-sm ${styles.wrap}`}>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className={`mb-2 text-sm font-semibold tracking-wide uppercase ${styles.title}`}>
            핵심 한눈 요약
          </p>
          <h2 className="text-2xl font-bold tracking-tight">{headline}</h2>
          <p className="mt-4 leading-7 text-foreground/90">{summary}</p>
        </div>

        <div className="rounded-xl border bg-background/80 p-4 dark:bg-background/40">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            핵심 관리 포인트
          </p>
          {keyPoints.length ? (
            <ul className="space-y-3 text-sm">
              {keyPoints.map((point, index) => (
                <li key={index} className="flex gap-3 leading-6">
                  <span className="mt-1 text-xs">●</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              핵심 포인트 데이터가 아직 없습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function SectionCard({
  step,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <section className="my-8">
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-wrap items-center gap-3">
            {step ? (
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {step}
              </Badge>
            ) : null}
            <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
          </div>
          {description ? <CardDescription className="pt-1 text-sm leading-6">{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-6 p-6">{children}</CardContent>
      </Card>
    </section>
  );
}

export function InsightPanel({
  title,
  content,
  takeaway,
  variant = "default",
}: InsightPanelProps) {
  const variantClass =
    variant === "clinical"
      ? "border-sky-200/60 bg-sky-50/60 dark:border-sky-900/50 dark:bg-sky-950/20"
      : variant === "routine"
        ? "border-violet-200/60 bg-violet-50/60 dark:border-violet-900/50 dark:bg-violet-950/20"
        : "border-border bg-background";

  return (
    <div className={`rounded-2xl border p-5 ${variantClass}`}>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 leading-7 text-foreground/90">{content}</p>
      {takeaway ? (
        <div className="mt-4 rounded-xl border bg-background/80 p-4 dark:bg-background/50">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            핵심 의미
          </p>
          <p className="mt-2 text-sm leading-6">{takeaway}</p>
        </div>
      ) : null}
    </div>
  );
}

export function PriorityTargetCard({
  symptoms,
  targets,
  axis,
  explanation,
  habitPriorities = [],
}: PriorityTargetCardProps) {
  return (
    <Card className="rounded-2xl border-indigo-200/60 bg-indigo-50/40 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <CardHeader>
        <CardTitle className="text-xl tracking-tight">핵심 표적 및 관리 축</CardTitle>
        <CardDescription>
          현재 상태를 개선하는 데 우선적으로 볼 축과 표적입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <StatusChip label={`핵심 axis: ${axis}`} tone="info" />
          {symptoms.map((symptom, index) => (
            <StatusChip key={index} label={symptom} tone="warning" />
          ))}
        </div>

        {habitPriorities.length ? (
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              우선 생활습관
            </p>
            <div className="flex flex-wrap gap-2">
              {habitPriorities.map((habit, index) => (
                <ScoreBadge key={index} label={habit} tone="success" />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            관련 바이오 타깃
          </p>
          <div className="flex flex-wrap gap-2">
            {targets.map((target, index) => (
              <Badge key={index} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {target}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-4 dark:bg-background/40">
          <p className="leading-7 text-foreground/90">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EvidenceBridge({
  relationTitle,
  relationContent,
  paperSummaryTitle,
  paperSummary,
  relevanceTitle,
  relevanceContent,
  extraEvidenceTitle,
  extraEvidenceContent,
}: EvidenceBridgeProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{relationTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-foreground/90">{relationContent}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{paperSummaryTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-foreground/90">{paperSummary}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{relevanceTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-foreground/90">{relevanceContent}</p>
        </CardContent>
      </Card>

      {extraEvidenceTitle && extraEvidenceContent ? (
        <Card className="rounded-2xl border-dashed lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base tracking-tight">{extraEvidenceTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">{extraEvidenceContent}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function ActionTimeline({
  goalTitle,
  goalContent,
  firstWeekTitle,
  firstWeekContent,
  eightWeekTitle,
  eightWeekContent,
  firstWeekChecklist = [],
  eightWeekChecklist = [],
}: ActionTimelineProps) {
  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-emerald-200/60 bg-emerald-50/50 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">{goalTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-7 text-foreground/90">{goalContent}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg tracking-tight">{firstWeekTitle}</CardTitle>
            <CardDescription>초반 리듬 회복과 기록 안정화에 집중합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-foreground/90">{firstWeekContent}</p>
            {firstWeekChecklist.length ? <RoutineChecklist title="7일 체크리스트" items={firstWeekChecklist} /> : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg tracking-tight">{eightWeekTitle}</CardTitle>
            <CardDescription>작은 행동을 반복 가능한 시스템으로 만듭니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-foreground/90">{eightWeekContent}</p>
            {eightWeekChecklist.length ? <RoutineChecklist title="8주 핵심 실행" items={eightWeekChecklist} /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DoctorQuestionBox({
  title = "상담 시 참고 질문",
  intro,
  questions,
}: DoctorQuestionBoxProps) {
  if (!questions.length) return null;

  return (
    <Card className="rounded-2xl border-sky-200/60 bg-sky-50/50 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20">
      <CardHeader>
        <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
        {intro ? <CardDescription className="leading-6">{intro}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          {questions.map((question, index) => (
            <li key={index} className="flex gap-3 leading-6">
              <span className="mt-1 text-xs text-sky-600 dark:text-sky-400">▸</span>
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function WarningPanel({
  title = "주의사항",
  items,
  emergencyNote,
}: WarningPanelProps) {
  if (!items.length && !emergencyNote) return null;

  return (
    <Alert variant="destructive" className="my-6 rounded-2xl">
      <AlertTitle className="mb-3 text-lg font-semibold tracking-tight">{title}</AlertTitle>
      <AlertDescription>
        {items.length ? (
          <ul className="space-y-3 text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex gap-3 leading-6">
                <span className="mt-1 text-xs">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {emergencyNote ? (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-background/80 p-4 dark:bg-background/40">
            <p className="text-sm leading-6">{emergencyNote}</p>
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function ReportClosing({
  message,
  nextStepTitle = "다음 권장 단계",
  nextStepItems = [],
}: ReportClosingProps) {
  return (
    <section className="rounded-2xl border bg-muted/20 px-6 py-6 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight">마무리 안내</h2>
      <p className="mt-4 leading-7 text-foreground/90">{message}</p>

      {nextStepItems.length ? (
        <div className="mt-6 rounded-xl border bg-background p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {nextStepTitle}
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {nextStepItems.map((item, index) => (
              <li key={index} className="flex gap-3 leading-6">
                <span className="mt-1 text-xs">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function ScoreBadge({
  label,
  value,
  tone = "default",
}: ScoreBadgeProps) {
  return (
    <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs ${getBadgeClasses(tone)}`}>
      {label}
      {value !== undefined ? <span className="ml-1 font-semibold">{value}</span> : null}
    </Badge>
  );
}

export function StatusChip({
  label,
  tone = "default",
}: StatusChipProps) {
  return (
    <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs ${getBadgeClasses(tone)}`}>
      {label}
    </Badge>
  );
}

export function DataConfidenceBox({
  level,
  message,
  recommendation,
}: DataConfidenceBoxProps) {
  const styles = getConfidenceClasses(level);

  return (
    <div className={`rounded-2xl border px-5 py-4 ${styles.wrap}`}>
      <p className={`text-sm font-semibold uppercase tracking-wide ${styles.title}`}>
        {styles.label}
      </p>
      <p className="mt-2 leading-7 text-foreground/90">{message}</p>
      {recommendation ? (
        <div className="mt-4 rounded-xl border bg-background/80 p-4 dark:bg-background/40">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            권장 사항
          </p>
          <p className="mt-2 text-sm leading-6">{recommendation}</p>
        </div>
      ) : null}
    </div>
  );
}

export function EvidenceLevelTag({ label }: EvidenceLevelTagProps) {
  const normalized = label.toLowerCase();
  const tone: BadgeTone = normalized.includes("systematic") || normalized.includes("meta")
    ? "success"
    : normalized.includes("rct")
      ? "info"
      : normalized.includes("observational")
        ? "warning"
        : "default";

  return <ScoreBadge label={label} tone={tone} />;
}

export function RoutineChecklist({
  title = "실행 체크리스트",
  items,
}: RoutineChecklistProps) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-3 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 leading-6">
            <span className="mt-1 size-4 rounded-sm border bg-background" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportFooterMeta({
  createdAt,
  version,
  contactEmail,
  medicalDisclaimer = "본 리포트는 참고용 건강정보이며 의사의 진단, 처방 또는 치료를 대체하지 않습니다.",
  aiNotice = "이 리포트에는 AI를 활용한 자동화된 분석 결과가 포함될 수 있습니다.",
}: ReportFooterMetaProps) {
  return (
    <footer className="mt-10 rounded-2xl border bg-muted/20 px-5 py-5 text-sm text-muted-foreground">
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="font-semibold text-foreground">리포트 메타 정보</p>
          <p className="mt-2">생성일: {createdAt ?? "-"}</p>
          <p>버전: {version ?? "-"}</p>
          {contactEmail ? <p>문의: {contactEmail}</p> : null}
        </div>

        <div>
          <p className="font-semibold text-foreground">의료 안내</p>
          <p className="mt-2 leading-6">{medicalDisclaimer}</p>
        </div>

        <div>
          <p className="font-semibold text-foreground">AI 안내</p>
          <p className="mt-2 leading-6">{aiNotice}</p>
        </div>
      </div>
      <Separator className="my-4" />
      <p className="text-xs leading-5">
        건강 관련 중요한 결정은 반드시 의료전문가와 상의한 뒤 진행하시기 바랍니다.
      </p>
    </footer>
  );
}
