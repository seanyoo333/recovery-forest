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
  tone?: Tone;
};

type ReportTableOfContentsItem = {
  id: string;
  label: string;
  step?: string;
};

type ReportTableOfContentsProps = {
  title?: string;
  items: ReportTableOfContentsItem[];
};

type InsightPanelProps = {
  titlePrefix?: string;
  title: string;
  content: string;
  takeaway?: string;
  variant?: "default" | "clinical" | "routine";
};

type PriorityTargetCardProps = {
  symptoms: string[];
  targets: string[];
  primaryAxis: string;
  secondaryAxis?: string;
  practicalAdvice: string;
  habitPriorities?: string[];
};

type EvidenceBridgeProps = {
  relationTitle: string;
  relationContent: string;
  paperSummaryTitle: string;
  paperSummary: string;
  relevanceTitle: string;
  relevanceContent: string;
  relevanceBlocks?: Array<{ title: string; content: string }>;
  extraEvidenceTitle?: string;
  extraEvidenceContent?: string;
};

type ActionTimelineProps = {
  firstWeekTitle: string;
  firstWeekContent: string;
  eightWeekTitle: string;
  eightWeekContent: string;
  avoidTitle: string;
  avoidContent: string;
  firstWeekChecklist?: string[];
  eightWeekChecklist?: string[];
  avoidChecklist?: string[];
};

type DoctorQuestionBoxProps = {
  step?: string;
  title?: string;
  intro?: string;
  questions: string[];
};

type WarningPanelProps = {
  step?: string;
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

const UNORDERED_MARKER_RE = /^[-•▪▸●]\s+/;
const ORDERED_MARKER_RE = /^\d+\s*[\.\)](?:\s*[\)\].:-])?\s*/;

type SmartListKind = "unordered" | "ordered";
const TITLE_MERGE_DELIMITER = " - ";
const FIXED_SECTION_TITLES = new Set([
  "현재 상태 한눈에 보기",
  "관련 바이오 표적 및 핵심 영역",
  "현재 상황 해석 근거와 의미",
  "실행 가이드",
  "통합의학 상담 시 질문 내용",
  "주의사항",
  "근거자료",
]);

function stripListMarker(line: string, kind: SmartListKind): string {
  const trimmed = line.trim();
  if (kind === "ordered") {
    return trimmed
      .replace(ORDERED_MARKER_RE, "")
      .replace(UNORDERED_MARKER_RE, "")
      .trim();
  }
  return trimmed
    .replace(UNORDERED_MARKER_RE, "")
    .replace(ORDERED_MARKER_RE, "")
    .trim();
}

function extractSmartList(text: string): { kind: SmartListKind; items: string[] } | null {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  // 1) 명시적 불릿/번호 리스트
  const orderedCount = lines.filter((line) => ORDERED_MARKER_RE.test(line)).length;
  const unorderedCount = lines.filter((line) => UNORDERED_MARKER_RE.test(line)).length;
  if (orderedCount + unorderedCount >= 2) {
    const kind: SmartListKind = orderedCount > unorderedCount ? "ordered" : "unordered";
    const items = lines
      .map((line) => stripListMarker(line, kind))
      .filter(Boolean);
    if (items.length >= 2) {
      return { kind, items };
    }
  }

  // 2) 줄바꿈으로 충분히 분리된 짧은 문장들(개조식 후보)
  if (lines.length >= 3 && lines.every((line) => line.length <= 90)) {
    return { kind: "unordered", items: lines };
  }

  // 3) 세미콜론으로 구분된 나열형 문장
  const semicolonItems = normalized
    .split(/[;；]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (semicolonItems.length >= 2) {
    return { kind: "unordered", items: semicolonItems };
  }

  return null;
}

function splitSectionDisplayTitle(title: string): {
  mainTitle: string;
  subTitle?: string;
} {
  const trimmed = title.trim();
  const delimiterIndex = trimmed.indexOf(TITLE_MERGE_DELIMITER);
  if (delimiterIndex <= 0) {
    return { mainTitle: trimmed };
  }

  const possibleMain = trimmed.slice(0, delimiterIndex).trim();
  const possibleSub = trimmed
    .slice(delimiterIndex + TITLE_MERGE_DELIMITER.length)
    .trim();
  if (!possibleSub || !FIXED_SECTION_TITLES.has(possibleMain)) {
    return { mainTitle: trimmed };
  }

  return {
    mainTitle: possibleMain,
    subTitle: possibleSub,
  };
}

function SmartBodyText({
  text,
  paragraphClassName,
  listClassName = "space-y-2 text-sm",
  itemClassName = "flex gap-3 leading-6",
  orderedListClassName = "list-decimal space-y-2 pl-5 text-sm",
  orderedItemClassName = "leading-6",
  bulletClassName = "mt-1 text-xs",
}: {
  text: string;
  paragraphClassName: string;
  listClassName?: string;
  itemClassName?: string;
  orderedListClassName?: string;
  orderedItemClassName?: string;
  bulletClassName?: string;
}) {
  const value = text.trim();
  if (!value) return null;

  const smartList = extractSmartList(value);
  if (smartList?.kind === "ordered") {
    return (
      <ol className={orderedListClassName}>
        {smartList.items.map((item, index) => (
          <li key={index} className={orderedItemClassName}>
            {item}
          </li>
        ))}
      </ol>
    );
  }

  if (smartList?.kind === "unordered") {
    return (
      <ul className={listClassName}>
        {smartList.items.map((item, index) => (
          <li key={index} className={itemClassName}>
            <span className={bulletClassName}>●</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className={paragraphClassName}>
      {value}
    </p>
  );
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
  tone = "focus",
}: ReportHeroSummaryProps) {
  const styles = getToneClasses(tone);

  return (
    <section className={`rounded-2xl border px-6 py-6 shadow-sm ${styles.wrap}`}>
      <div>
        <p className={`mb-2 text-sm font-semibold tracking-wide uppercase ${styles.title}`}>
          핵심 한눈 요약
        </p>
        <h2 className="text-2xl font-bold tracking-tight">{headline}</h2>
        <div className="mt-4">
          <SmartBodyText
            text={summary}
            paragraphClassName="leading-7 text-foreground/90"
            listClassName="space-y-3"
            itemClassName="flex gap-3 leading-7 text-foreground/90"
          />
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
  const { mainTitle, subTitle } = splitSectionDisplayTitle(title);
  return (
    <section className="my-8">
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-start gap-3">
            {step ? (
              <span className="bg-primary/12 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/25 text-sm font-bold">
                {step}
              </span>
            ) : null}
            <div className="space-y-1">
              <CardTitle className="text-2xl tracking-tight">{mainTitle}</CardTitle>
              {subTitle ? (
                <p className="text-muted-foreground text-sm font-medium tracking-tight">
                  {subTitle}
                </p>
              ) : null}
              {description ? (
                <CardDescription className="text-sm leading-6">{description}</CardDescription>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">{children}</CardContent>
      </Card>
    </section>
  );
}

export function ReportTableOfContents({
  title = "보고서 목차",
  items,
}: ReportTableOfContentsProps) {
  if (!items.length) return null;

  return (
    <Card className="rounded-2xl border bg-muted/20 shadow-sm">
      <CardHeader className="border-b bg-background/70">
        <CardTitle className="text-lg tracking-tight">{title}</CardTitle>
        <CardDescription>
          항목을 누르면 해당 섹션으로 바로 이동합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <ul className="grid gap-2 text-sm md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-foreground/90 hover:text-foreground hover:bg-background flex items-center gap-3 rounded-lg px-3 py-2 leading-6 transition-colors"
              >
                {item.step ? (
                  <span className="bg-primary/10 text-primary inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/20 text-xs font-bold">
                    {item.step}
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs">
                    -
                  </span>
                )}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function InsightPanel({
  titlePrefix,
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
      <h3 className="text-lg tracking-tight">
        {titlePrefix ? <span className="font-semibold">{titlePrefix}</span> : null}
        {titlePrefix && title ? <span className="mx-1" /> : null}
        <span className={titlePrefix ? "font-normal text-foreground/90" : "font-semibold"}>
          {title}
        </span>
      </h3>
      <div className="mt-3">
        <SmartBodyText
          text={content}
          paragraphClassName="leading-7 text-foreground/90"
          listClassName="space-y-3 text-sm"
          itemClassName="flex gap-3 leading-7 text-foreground/90"
        />
      </div>
      {takeaway ? (
        <div className="mt-4 rounded-xl border bg-background/80 p-4 dark:bg-background/50">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            핵심 의미
          </p>
          <div className="mt-2">
            <SmartBodyText
              text={takeaway}
              paragraphClassName="text-sm leading-6"
              listClassName="space-y-2 text-sm"
              itemClassName="flex gap-3 leading-6"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PriorityTargetCard({
  symptoms,
  targets,
  primaryAxis,
  secondaryAxis,
  practicalAdvice,
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
        <div className="rounded-xl border bg-background/80 p-4 dark:bg-background/40">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            2-1. 관련 바이오 표적 및 핵심 축
          </p>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                핵심 축 1
              </p>
              <SmartBodyText
                text={primaryAxis}
                paragraphClassName="leading-7 text-foreground/90"
                listClassName="space-y-2 text-sm"
                itemClassName="flex gap-3 leading-6 text-foreground/90"
              />
            </div>
            {secondaryAxis ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  핵심 축 2
                </p>
                <SmartBodyText
                  text={secondaryAxis}
                  paragraphClassName="leading-7 text-foreground/90"
                  listClassName="space-y-2 text-sm"
                  itemClassName="flex gap-3 leading-6 text-foreground/90"
                />
              </div>
            ) : null}
          </div>
          {symptoms.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <StatusChip key={index} label={symptom} tone="warning" />
              ))}
            </div>
          ) : null}
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
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            2-2. 표적·핵심 축 기반 실질적 조언
          </p>
          <SmartBodyText
            text={practicalAdvice}
            paragraphClassName="leading-7 text-foreground/90"
            listClassName="space-y-3 text-sm"
            itemClassName="flex gap-3 leading-7 text-foreground/90"
          />
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
  relevanceBlocks = [],
  extraEvidenceTitle,
  extraEvidenceContent,
}: EvidenceBridgeProps) {
  return (
    <div className="space-y-4">
      <Card className="self-start rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{relationTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartBodyText
            text={relationContent}
            paragraphClassName="text-sm leading-7 text-foreground/90"
            listClassName="space-y-3 text-sm"
            itemClassName="flex gap-3 leading-7 text-foreground/90"
          />
        </CardContent>
      </Card>

      <Card className="self-start rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{paperSummaryTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartBodyText
            text={paperSummary}
            paragraphClassName="text-sm leading-7 text-foreground/90"
            listClassName="space-y-3 text-sm"
            itemClassName="flex gap-3 leading-7 text-foreground/90"
          />
        </CardContent>
      </Card>

      <Card className="self-start rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{relevanceTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {relevanceBlocks.length > 0 ? (
            <div className="grid gap-3">
              {relevanceBlocks.map((block, index) => (
                <div
                  key={`${block.title}-${index}`}
                  className="rounded-xl border bg-muted/20 p-3"
                >
                  <p className="text-sm font-semibold tracking-tight">
                    {index + 1}. {block.title}
                  </p>
                  <div className="mt-2">
                    <SmartBodyText
                      text={block.content}
                      paragraphClassName="text-sm leading-6 text-foreground/90"
                      listClassName="space-y-2 text-sm"
                      itemClassName="flex gap-3 leading-6 text-foreground/90"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SmartBodyText
              text={relevanceContent}
              paragraphClassName="text-sm leading-7 text-foreground/90"
              listClassName="space-y-3 text-sm"
              itemClassName="flex gap-3 leading-7 text-foreground/90"
            />
          )}
        </CardContent>
      </Card>

      {extraEvidenceTitle && extraEvidenceContent ? (
        <Card className="rounded-2xl border-dashed lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base tracking-tight">{extraEvidenceTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <SmartBodyText
              text={extraEvidenceContent}
              paragraphClassName="text-sm leading-7 text-muted-foreground"
              listClassName="space-y-3 text-sm"
              itemClassName="flex gap-3 leading-7 text-muted-foreground"
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function ActionTimeline({
  firstWeekTitle,
  firstWeekContent,
  eightWeekTitle,
  eightWeekContent,
  avoidTitle,
  avoidContent,
  firstWeekChecklist = [],
  eightWeekChecklist = [],
  avoidChecklist = [],
}: ActionTimelineProps) {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{firstWeekTitle}</CardTitle>
          <CardDescription>초반 리듬 회복과 기록 안정화에 집중합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SmartBodyText
            text={firstWeekContent}
            paragraphClassName="text-sm leading-7 text-foreground/90"
            listClassName="space-y-3 text-sm"
            itemClassName="flex gap-3 leading-7 text-foreground/90"
          />
          {firstWeekChecklist.length ? <RoutineChecklist title="7일 체크리스트" items={firstWeekChecklist} /> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{eightWeekTitle}</CardTitle>
          <CardDescription>작은 행동을 반복 가능한 시스템으로 만듭니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SmartBodyText
            text={eightWeekContent}
            paragraphClassName="text-sm leading-7 text-foreground/90"
            listClassName="space-y-3 text-sm"
            itemClassName="flex gap-3 leading-7 text-foreground/90"
          />
          {eightWeekChecklist.length ? <RoutineChecklist title="8주 핵심 실행" items={eightWeekChecklist} /> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-rose-200/70 bg-rose-50/50 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{avoidTitle}</CardTitle>
          <CardDescription>부담을 키우거나 계획을 흐트러뜨리는 행동은 피해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {avoidChecklist.length === 0 ? (
            <SmartBodyText
              text={avoidContent}
              paragraphClassName="text-sm leading-7 text-foreground/90"
              listClassName="space-y-3 text-sm"
              itemClassName="flex gap-3 leading-7 text-foreground/90"
            />
          ) : null}
          {avoidChecklist.length ? (
            <div className="rounded-xl border bg-background/70 p-4 dark:bg-background/40">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                꼭 피해야 할 3가지
              </p>
              <ol className="mt-3 space-y-3 text-sm">
                {avoidChecklist.map((item, index) => (
                  <li key={index} className="flex gap-3 leading-6">
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="whitespace-pre-line">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function DoctorQuestionBox({
  step,
  title = "상담 시 참고 질문",
  intro,
  questions,
}: DoctorQuestionBoxProps) {
  if (!questions.length) return null;
  const { mainTitle, subTitle } = splitSectionDisplayTitle(title);

  return (
    <Card className="rounded-2xl border-sky-200/60 bg-sky-50/50 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          {step ? (
            <span className="bg-primary/12 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/25 text-sm font-bold">
              {step}
            </span>
          ) : null}
          <div>
            <CardTitle className="pt-1 text-xl tracking-tight">{mainTitle}</CardTitle>
            {subTitle ? (
              <p className="text-muted-foreground mt-1 text-sm font-medium tracking-tight">
                {subTitle}
              </p>
            ) : null}
          </div>
        </div>
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
  step,
  title = "주의사항",
  items,
  emergencyNote,
}: WarningPanelProps) {
  if (!items.length && !emergencyNote) return null;
  const { mainTitle, subTitle } = splitSectionDisplayTitle(title);

  return (
    <Alert variant="destructive" className="my-6 rounded-2xl">
      <AlertTitle className="mb-3">
        <div className="flex items-start gap-3">
          {step ? (
            <span className="bg-destructive/10 text-destructive inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-destructive/30 text-sm font-bold">
              {step}
            </span>
          ) : null}
          <div className="pt-1">
            <p className="text-lg font-semibold tracking-tight">{mainTitle}</p>
            {subTitle ? (
              <p className="text-muted-foreground mt-1 text-sm font-medium tracking-tight">
                {subTitle}
              </p>
            ) : null}
          </div>
        </div>
      </AlertTitle>
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
      <div className="mt-4">
        <SmartBodyText
          text={message}
          paragraphClassName="leading-7 text-foreground/90"
          listClassName="space-y-3 text-sm"
          itemClassName="flex gap-3 leading-7 text-foreground/90"
        />
      </div>

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
