import type { ReactNode } from "react";
import { getMDXComponent } from "mdx-bundler/client";

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyList,
  TypographyOrderedList,
  TypographyP,
} from "~/core/components/mdx-typography1";
import {
  ActionTimeline,
  DoctorQuestionBox,
  EvidenceBridge,
  InsightPanel,
  PriorityTargetCard,
  ReportClosing,
  ReportCover,
  ReportFooterMeta,
  ReportTableOfContents,
  SectionCard,
  WarningPanel,
} from "~/core/components/report_components";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  AskDoctorList,
  Callout,
  ReferenceList,
  SummaryBox,
  WarningBox,
} from "~/features/blog/components/blog-components";
import type {
  ReportContentAvailability,
  ReportJson,
} from "~/features/users/dashboard/report-detail-utils";
import {
  parseListItems,
  parseSectionBlocks,
  stripAngleBrackets,
} from "~/features/users/dashboard/report-detail-utils";

type ReportSection = Record<string, unknown>;
type PremiumSectionId =
  | "overview"
  | "target-axis"
  | "evidence"
  | "action-guide"
  | "consultation"
  | "warnings"
  | "closing";

type PremiumSectionNavItem = {
  id: PremiumSectionId;
  step?: string;
  label: string;
  sectionKey: string;
};

type PremiumReportSections = {
  firstSection?: ReportSection;
  secondSection?: ReportSection;
  thirdSection?: ReportSection;
  fourthSection?: ReportSection;
  fifthSection?: ReportSection;
  sixthSection?: ReportSection;
};

type OverviewPanel = {
  titlePrefix?: string;
  title: string;
  content: string;
  variant: "default" | "clinical" | "routine";
};

const REPORT_META_KEYS = new Set([
  "Title",
  "title",
  "starting_sentence",
  "ending_sentence",
  "context",
  "html",
]);

const OVERVIEW_SUMMARY_TITLE_ALIASES = [
  "total_individualized_summary",
  "total individualized summary",
];

const PREMIUM_SECTION_NAV: PremiumSectionNavItem[] = [
  {
    id: "overview",
    step: "1",
    label: "현재 상태 한눈에 보기",
    sectionKey: "first_section",
  },
  {
    id: "target-axis",
    step: "2",
    label: "핵심 표적 및 관리 축",
    sectionKey: "second_section",
  },
  {
    id: "evidence",
    step: "3",
    label: "근거 및 연구 요약",
    sectionKey: "third_section",
  },
  {
    id: "action-guide",
    step: "4",
    label: "실행 가이드",
    sectionKey: "forth_section",
  },
  {
    id: "consultation",
    step: "5",
    label: "상담 시 참고",
    sectionKey: "fifth_section",
  },
  {
    id: "warnings",
    step: "6",
    label: "주의사항",
    sectionKey: "sixth_section",
  },
];

const SECTION_KEY_TO_ID: Record<string, PremiumSectionId> = {
  first_section: "overview",
  second_section: "target-axis",
  third_section: "evidence",
  forth_section: "action-guide",
  fourth_section: "action-guide",
  fifth_section: "consultation",
  sixth_section: "warnings",
  closing: "closing",
  ending: "closing",
};

function sanitizeTocLabel(value: string): string {
  return stripAngleBrackets(value)
    .replace(/^\s*\d+\s*[\.\)]\s*/, "")
    .trim();
}

function normalizeSectionKey(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, "_").trim();
}

function resolveSectionId(value: string): PremiumSectionId | null {
  const normalized = normalizeSectionKey(value);
  if (normalized in SECTION_KEY_TO_ID) {
    return SECTION_KEY_TO_ID[normalized];
  }
  return null;
}

const SECTION_LABEL_TO_ID: Array<{ keyword: string; id: PremiumSectionId }> = [
  { keyword: "현재상태한눈에보기", id: "overview" },
  { keyword: "핵심표적및관리축", id: "target-axis" },
  { keyword: "근거및연구요약", id: "evidence" },
  { keyword: "실행가이드", id: "action-guide" },
  { keyword: "상담시참고", id: "consultation" },
  { keyword: "주의사항", id: "warnings" },
  { keyword: "마무리안내", id: "closing" },
  { keyword: "overview", id: "overview" },
  { keyword: "target", id: "target-axis" },
  { keyword: "evidence", id: "evidence" },
  { keyword: "action", id: "action-guide" },
  { keyword: "consultation", id: "consultation" },
  { keyword: "warning", id: "warnings" },
];

function resolveSectionIdFromLabel(value: string): PremiumSectionId | null {
  const normalized = sanitizeTocLabel(value)
    .toLowerCase()
    .replace(/\s+/g, "");
  if (!normalized) return null;

  const matched = SECTION_LABEL_TO_ID.find(({ keyword }) =>
    normalized.includes(keyword),
  );
  return matched?.id ?? null;
}

function sectionById(id: PremiumSectionId): PremiumSectionNavItem {
  return PREMIUM_SECTION_NAV.find((item) => item.id === id)!;
}

function sectionVisible(
  section: PremiumSectionNavItem,
  model: Pick<
    PremiumReportModel,
    "sectionKeySet" | "sections" | "overviewPanels" | "closingMessage"
  >,
): boolean {
  switch (section.id) {
    case "overview":
      return model.overviewPanels.length > 0;
    case "target-axis":
      return Boolean(
        model.sectionKeySet.has("second_section") && model.sections.secondSection,
      );
    case "evidence":
      return Boolean(
        model.sectionKeySet.has("third_section") && model.sections.thirdSection,
      );
    case "action-guide":
      return Boolean(
        model.sectionKeySet.has("forth_section") && model.sections.fourthSection,
      );
    case "consultation":
      return Boolean(
        model.sectionKeySet.has("fifth_section") && model.sections.fifthSection,
      );
    case "warnings":
      return Boolean(
        model.sectionKeySet.has("sixth_section") && model.sections.sixthSection,
      );
    case "closing":
      return model.closingMessage.trim().length > 0;
    default:
      return false;
  }
}

function getVisibleSectionNav(
  model: Pick<
    PremiumReportModel,
    "sectionKeySet" | "sections" | "overviewPanels" | "closingMessage"
  >,
): PremiumSectionNavItem[] {
  return PREMIUM_SECTION_NAV.filter((section) => sectionVisible(section, model));
}

type TocCandidate = {
  label?: string;
  sectionRef?: string;
};

function parseTocCandidate(item: unknown): TocCandidate | null {
  if (typeof item === "string") {
    const label = sanitizeTocLabel(item);
    return label ? { label } : null;
  }
  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;
  const labelSource =
    record.label ??
    record.title ??
    record.text ??
    record.name ??
    record.item;
  const sectionSource =
    record.section_key ??
    record.section ??
    record.key ??
    record.id ??
    record.anchor ??
    record.href;
  if (typeof labelSource !== "string") return null;

  const label = sanitizeTocLabel(labelSource);
  if (!label && typeof sectionSource !== "string") return null;
  return {
    label: label || undefined,
    sectionRef: typeof sectionSource === "string" ? sectionSource : undefined,
  };
}

function buildPremiumTocItems(
  data: ReportJson,
  visibleSections: PremiumSectionNavItem[],
): Array<{ id: PremiumSectionId; label: string; step?: string }> {
  const defaultItems = visibleSections.map((section) => ({
    id: section.id,
    label: section.label,
    step: section.step,
  }));

  const rawToc = data.table_of_contents ?? data.tableOfContents;
  if (!rawToc) {
    return defaultItems;
  }

  let candidates: TocCandidate[] = [];
  if (Array.isArray(rawToc)) {
    candidates = rawToc.map(parseTocCandidate).filter(Boolean) as TocCandidate[];
  } else if (typeof rawToc === "object" && rawToc !== null) {
    candidates = Object.entries(rawToc as Record<string, unknown>)
      .map(([key, value]) => {
        if (typeof value !== "string") return null;
        const label = sanitizeTocLabel(value);
        if (!label) return null;
        return { label, sectionRef: key } satisfies TocCandidate;
      })
      .filter(Boolean) as TocCandidate[];
  }

  if (candidates.length === 0) {
    return defaultItems;
  }

  const visibleIds = new Set(visibleSections.map((section) => section.id));
  const usedIds = new Set<PremiumSectionId>();
  const mapped = candidates
    .map((candidate, index) => {
      const candidateIdFromRef = candidate.sectionRef
        ? resolveSectionId(candidate.sectionRef.replace(/^#/, ""))
        : null;
      const candidateIdFromLabel = candidate.label
        ? resolveSectionIdFromLabel(candidate.label)
        : null;
      const candidateId = candidateIdFromRef ?? candidateIdFromLabel;
      const fallbackId = visibleSections[index]?.id ?? null;
      const id =
        (candidateId && visibleIds.has(candidateId) ? candidateId : fallbackId) ?? null;
      if (!id || usedIds.has(id)) return null;
      usedIds.add(id);

      const section = sectionById(id);
      return {
        id,
        step: section.step,
        label: section.label,
      };
    })
    .filter(Boolean) as Array<{ id: PremiumSectionId; label: string; step?: string }>;

  const missingDefaults = defaultItems.filter((item) => !usedIds.has(item.id));
  return [...mapped, ...missingDefaults];
}

function ReportAnchorSection({
  id,
  children,
}: {
  id: PremiumSectionId;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      {children}
    </section>
  );
}

function getRenderableSectionKeySet(data: ReportJson): Set<string> {
  const context = (data.context as string[]) ?? [];
  const keysFromContext = context.filter(
    (key) =>
      typeof key === "string" &&
      typeof data[key] === "object" &&
      data[key] !== null,
  );

  if (keysFromContext.length > 0) {
    return new Set(keysFromContext);
  }

  return new Set(
    Object.keys(data).filter(
      (key) =>
        !REPORT_META_KEYS.has(key) &&
        typeof data[key] === "object" &&
        data[key] !== null,
    ),
  );
}

function getPremiumReportSections(data: ReportJson): PremiumReportSections {
  return {
    firstSection: data.first_section as ReportSection | undefined,
    secondSection: data.second_section as ReportSection | undefined,
    thirdSection: data.third_section as ReportSection | undefined,
    fourthSection: data.forth_section as ReportSection | undefined,
    fifthSection: data.fifth_section as ReportSection | undefined,
    sixthSection: data.sixth_section as ReportSection | undefined,
  };
}

function isOverviewSummaryTitle(title: string | undefined): boolean {
  return OVERVIEW_SUMMARY_TITLE_ALIASES.includes((title ?? "").toLowerCase());
}

function getConsultationQuestions(section: ReportSection): string[] {
  return [
    ...(section.current_interaction_content
      ? parseListItems(String(section.current_interaction_content))
      : []),
    ...(section.suggested_interaction_content
      ? parseListItems(String(section.suggested_interaction_content))
      : []),
    ...parseSectionBlocks(section).flatMap((block) =>
      parseListItems(block.content),
    ),
  ].filter((question) => question.length > 0);
}

function pickFirstNonEmptyString(
  section: ReportSection | undefined,
  keys: string[],
): string {
  if (!section) return "";
  for (const key of keys) {
    const value = section[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function withOverviewTitle(
  prefix: string,
  rawTitle: string,
): { titlePrefix: string; title: string } {
  const cleaned = stripAngleBrackets(rawTitle).trim();
  if (!cleaned) {
    return { titlePrefix: prefix, title: "" };
  }
  if (cleaned.startsWith(prefix)) {
    return { titlePrefix: prefix, title: cleaned.replace(prefix, "").trim() };
  }
  return { titlePrefix: prefix, title: cleaned };
}

function toReadableOverviewContent(raw: string): string {
  const original = raw.trim();
  if (!original) return "";

  // 이미 불릿/번호 형식이면 기존 서식을 그대로 유지
  const hasListMarker = /(^|\n)\s*(?:[-•▪▸●]|\d+\s*[\.\)])\s+/m.test(original);
  if (hasListMarker) return original;

  const lineItems = original
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lineItems.length >= 2) {
    return lineItems.slice(0, 5).map((line) => `- ${line}`).join("\n");
  }

  const normalized = stripAngleBrackets(original).replace(/\s+/g, " ").trim();
  const sentenceCandidates = normalized
    .split(/(?:다\.\s+|[.!?]\s+|[;；]\s*)/g)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6);
  if (sentenceCandidates.length < 2) {
    return original;
  }

  return sentenceCandidates
    .slice(0, 5)
    .map((item) => `- ${item}`)
    .join("\n");
}

function buildOverviewPanels(
  firstSection: ReportSection | undefined,
): OverviewPanel[] {
  if (!firstSection) return [];

  const orderedCandidates: Array<{
    titleKeys: string[];
    contentKeys: string[];
    prefix: string;
    variant: OverviewPanel["variant"];
  }> = [
    {
      titleKeys: ["general_health_title"],
      contentKeys: ["general_health_content"],
      prefix: "1. 일반기록 기반 건강 정보:",
      variant: "default",
    },
    {
      titleKeys: ["blood_health_title"],
      contentKeys: ["blood_health_content"],
      prefix: "2. 혈액검사 기반 건강 정보:",
      variant: "clinical",
    },
    {
      titleKeys: ["routine_healthi_title", "routine_health_title"],
      contentKeys: ["routine_healthi_content", "routine_health_content"],
      prefix: "3. 생활습관 기록 기반 건강정보:",
      variant: "routine",
    },
    {
      titleKeys: [
        "top_concerns_related_advice_title",
        "total_individualized_summary",
      ],
      contentKeys: [
        "top_concerns_related_advice_content",
        "total_individualized_summary_content",
      ],
      prefix: "4. 관심 건강 항목 개선을 위한 조언 정보:",
      variant: "default",
    },
  ];

  const orderedPanels = orderedCandidates
    .map((candidate) => {
      const content =
        pickFirstNonEmptyString(firstSection, candidate.contentKeys);
      if (!content) return null;
      const rawTitle = pickFirstNonEmptyString(firstSection, candidate.titleKeys);
      const titleParts = withOverviewTitle(candidate.prefix, rawTitle);
      return {
        titlePrefix: titleParts.titlePrefix,
        title: titleParts.title,
        content: toReadableOverviewContent(content),
        variant: candidate.variant,
      } satisfies OverviewPanel;
    })
    .filter(Boolean) as OverviewPanel[];
  if (orderedPanels.length > 0) {
    return orderedPanels;
  }

  return parseSectionBlocks(firstSection)
    .filter((block) => !isOverviewSummaryTitle(block.title))
    .map((block) => ({
      title: stripAngleBrackets(block.title),
      content: toReadableOverviewContent(block.content),
      variant: block.title?.toLowerCase().includes("routine")
        ? "routine"
        : block.title?.toLowerCase().includes("blood")
          ? "clinical"
          : "default",
    }));
}

type PremiumReportModel = {
  title: string;
  openingSummary: string;
  closingMessage: string;
  createdAt: string;
  sectionKeySet: Set<string>;
  sections: PremiumReportSections;
  overviewPanels: OverviewPanel[];
  tocItems: Array<{ id: PremiumSectionId; label: string; step?: string }>;
};

function buildPremiumReportModel(
  data: ReportJson,
  createdAt: string,
): PremiumReportModel {
  const openingSummary = (data.starting_sentence as string) ?? "";
  const sections = getPremiumReportSections(data);
  const firstSection = sections.firstSection;
  const overviewPanels = buildOverviewPanels(firstSection);
  const sectionKeySet = getRenderableSectionKeySet(data);
  const closingMessage = (data.ending_sentence as string) ?? "";

  const baseModel = {
    title: stripAngleBrackets(
      (data.Title as string) ?? (data.title as string) ?? "맞춤 건강 보고서",
    ),
    openingSummary,
    closingMessage,
    createdAt,
    sectionKeySet,
    sections,
    overviewPanels,
  };

  const visibleSections = getVisibleSectionNav(baseModel);

  return {
    ...baseModel,
    tocItems: buildPremiumTocItems(data, visibleSections),
  };
}

/** 0. 보고서 표지 + 핵심 요약 */
function ReportOpeningSection({ model }: { model: PremiumReportModel }) {
  const { title, openingSummary, createdAt } = model;

  return (
    <>
      <ReportCover
        title={title}
        subtitle={openingSummary.trim() || undefined}
        reportType="개인 맞춤 건강 전략 리포트"
        createdAt={createdAt}
        brandName="Evidence Base"
      />
    </>
  );
}

/** 1. 현재 상태 한눈에 보기 */
function OverviewSection({ model }: { model: PremiumReportModel }) {
  if (model.overviewPanels.length === 0) return null;

  return (
    <ReportAnchorSection id="overview">
      <SectionCard
        step="1"
        title="현재 상태 한눈에 보기"
        description="혈액·생활습관·전체 요약을 종합한 개인화 해석입니다."
      >
        <div className="space-y-4">
          {model.overviewPanels.map((panel, index) => (
              <InsightPanel
                key={index}
                titlePrefix={panel.titlePrefix}
                title={panel.title}
                content={panel.content}
                variant={panel.variant}
              />
          ))}
        </div>
      </SectionCard>
    </ReportAnchorSection>
  );
}

/** 2. 핵심 표적 및 관리 축 */
function TargetAxisSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.secondSection;
  if (!model.sectionKeySet.has("second_section") || !section) return null;

  return (
    <ReportAnchorSection id="target-axis">
      <SectionCard
        step="2"
        title="핵심 표적 및 관리 축"
        description="우선적으로 살펴볼 바이오마커와 생활습관 포인트입니다."
      >
        <PriorityTargetCard
          axis={stripAngleBrackets((section.major_targets_axis as string) ?? "종합")}
          explanation={(section.targets_axis_explanation as string) ?? ""}
          symptoms={[]}
          targets={[]}
        />
      </SectionCard>
    </ReportAnchorSection>
  );
}

/** 3. 근거 및 연구 요약 */
function EvidenceSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.thirdSection;
  if (!model.sectionKeySet.has("third_section") || !section) return null;

  const hasBridgeData =
    section.relation_between_targets_status != null ||
    section.top_paper_research != null;

  return (
    <ReportAnchorSection id="evidence">
      <SectionCard
        step="3"
        title="근거 및 연구 요약"
        description="표적과 생활습관 연결 근거, 관련 논문·리소스 요약입니다."
      >
        {hasBridgeData ? (
          <EvidenceBridge
            relationTitle={stripAngleBrackets(
              (section.relation_between_targets_status as string) ?? "표적-상태 연결",
            )}
            relationContent={(section.relation_content as string) ?? ""}
            paperSummaryTitle={stripAngleBrackets(
              (section.top_paper_research as string) ?? "관련 연구",
            )}
            paperSummary={(section.top_paper_research_content as string) ?? ""}
            relevanceTitle="맞춤 해석"
            relevanceContent={
              (section.relation_content as string) ??
              (section.top_paper_research_content as string) ??
              ""
            }
            extraEvidenceTitle={section.top_blog ? String(section.top_blog) : undefined}
            extraEvidenceContent={
              (section.top_blog_content as string) ??
              (section.top_blog
                ? ((section as Record<string, unknown>)[`top_blog_content`] as string)
                : undefined)
            }
          />
        ) : (
          <div className="space-y-4">
            {parseSectionBlocks(section).map((block, index) => (
              <InsightPanel
                key={index}
                title={stripAngleBrackets(block.title)}
                content={block.content}
                variant="default"
              />
            ))}
          </div>
        )}
      </SectionCard>
    </ReportAnchorSection>
  );
}

/** 4. 실행 가이드 */
function ActionGuideSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.fourthSection;
  if (!model.sectionKeySet.has("forth_section") || !section) return null;

  return (
    <ReportAnchorSection id="action-guide">
      <SectionCard
        step="4"
        title="실행 가이드"
        description="목표와 7일·8주 단위 실행 계획입니다."
      >
        <ActionTimeline
          goalTitle={stripAngleBrackets((section.goal_action as string) ?? "목표")}
          goalContent={(section.goal_action_content as string) ?? ""}
          firstWeekTitle={stripAngleBrackets(
            (section.goal_7d_action as string) ?? "7일 실행",
          )}
          firstWeekContent={(section.goal_7d_action_content as string) ?? ""}
          eightWeekTitle={stripAngleBrackets(
            (section.goal_8w_action as string) ?? "8주 실행",
          )}
          eightWeekContent={(section.goal_8w_action_content as string) ?? ""}
        />
      </SectionCard>
    </ReportAnchorSection>
  );
}

/** 5. 상담 시 참고 */
function ConsultationSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.fifthSection;
  if (!model.sectionKeySet.has("fifth_section") || !section) return null;

  const questions = getConsultationQuestions(section);
  if (questions.length > 0) {
    return (
      <ReportAnchorSection id="consultation">
        <DoctorQuestionBox
          step="5"
          title="상담 시 참고"
          intro={(section.things_to_ask as string) ?? undefined}
          questions={questions}
        />
      </ReportAnchorSection>
    );
  }

  return (
    <ReportAnchorSection id="consultation">
      <SectionCard
        step="5"
        title="상담 시 참고"
        description="담당 선생님과 상의할 때 참고하실 수 있는 내용입니다."
      >
        <div className="space-y-4">
          {parseSectionBlocks(section).map((block, index) => (
            <InsightPanel
              key={index}
              title={stripAngleBrackets(block.title)}
              content={block.content}
              variant="default"
            />
          ))}
        </div>
      </SectionCard>
    </ReportAnchorSection>
  );
}

/** 6. 주의사항 */
function WarningSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.sixthSection;
  if (!model.sectionKeySet.has("sixth_section") || !section) return null;

  return (
    <ReportAnchorSection id="warnings">
      <WarningPanel
        step="6"
        title="주의사항"
        items={parseListItems((section.warnings_content as string) ?? "")}
      />
    </ReportAnchorSection>
  );
}

/** 7. 마무리 */
function ClosingSection({ model }: { model: PremiumReportModel }) {
  if (!model.closingMessage.trim()) return null;
  return (
    <ReportAnchorSection id="closing">
      <ReportClosing
        message={model.closingMessage}
        nextStepTitle="다음 권장 단계"
        nextStepItems={[]}
      />
    </ReportAnchorSection>
  );
}

/** report_components 기반 유료 프리미엄 보고서 렌더러 */
export function PremiumReportRenderer({
  data,
  createdAt,
}: {
  data: ReportJson | null | undefined;
  createdAt: string;
}) {
  if (!data || typeof data !== "object") return null;
  const model = buildPremiumReportModel(data, createdAt);

  return (
    <article className="max-w-4xl space-y-10">
      <ReportOpeningSection model={model} />
      <ReportTableOfContents items={model.tocItems} />
      <OverviewSection model={model} />
      <TargetAxisSection model={model} />
      <EvidenceSection model={model} />
      <ActionGuideSection model={model} />
      <ConsultationSection model={model} />
      <WarningSection model={model} />
      <ClosingSection model={model} />
      <ReportFooterMeta
        createdAt={model.createdAt}
        medicalDisclaimer="본 리포트는 참고용 건강정보이며, 의료행위·진단·처방을 대체하지 않습니다."
        aiNotice="이 리포트에는 AI를 활용한 자동화된 분석 결과가 포함될 수 있습니다."
      />
    </article>
  );
}

/** 기존 범용 구조 대응 (html, sections, body 등) */
export function FallbackReportRenderer({
  data,
}: {
  data: ReportJson | null | undefined;
}) {
  if (!data) return null;
  if (
    typeof (data as { html?: string }).html === "string" &&
    (data as { html: string }).html.trim()
  ) {
    return (
      <div
        className="prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: (data as { html: string }).html }}
      />
    );
  }
  const body = (data as { body?: string }).body;
  if (typeof body === "string" && body.trim()) {
    return <p className="leading-relaxed whitespace-pre-wrap">{body}</p>;
  }
  return null;
}

/** MDX 번들 코드로 블로그 컴포넌트 재사용 렌더 */
export function HealthReportMDXContent({ code }: { code: string }) {
  const MDXContent = getMDXComponent(code);
  return (
    <MDXContent
      components={{
        h1: TypographyH1,
        h2: TypographyH2,
        h3: TypographyH3,
        h4: TypographyH4,
        p: TypographyP,
        blockquote: TypographyBlockquote,
        ul: TypographyList,
        ol: TypographyOrderedList,
        code: TypographyInlineCode,
        Button,
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        SummaryBox,
        WarningBox,
        Callout,
        AskDoctorList,
        ReferenceList,
      }}
    />
  );
}

type HealthReportContentProps = {
  availability: ReportContentAvailability;
  reportJson: ReportJson | null;
  reportHtml: string | null;
  mdxCode: string | null;
  createdAtKoreanDate: string;
};

/** 상세 페이지 본문 렌더 경로(Premium -> MDX -> HTML -> Fallback) */
export function HealthReportContent({
  availability,
  reportJson,
  reportHtml,
  mdxCode,
  createdAtKoreanDate,
}: HealthReportContentProps) {
  if (availability.hasPremiumReportData) {
    return (
      <PremiumReportRenderer data={reportJson} createdAt={createdAtKoreanDate} />
    );
  }

  if (availability.hasMdxCode) {
    return (
      <article className="max-w-4xl [&_blockquote+p]:-mt-0 [&_h2+ol]:-mt-2 [&_h2+ul]:-mt-2 [&_h3+ol]:-mt-2 [&_h3+ul]:-mt-2 [&_h4+ol]:-mt-2 [&_h4+ul]:-mt-2 [&_li_ol]:my-0 [&_li_ol]:-mt-2 [&_li_ul]:my-0 [&_li_ul]:-mt-2 [&_p+blockquote]:-mt-0 [&_p+ol]:-mt-2 [&_p+ul]:-mt-2">
        {mdxCode && <HealthReportMDXContent code={mdxCode} />}
      </article>
    );
  }

  if (availability.hasSavedHtml) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: reportHtml! }}
          />
        </CardContent>
      </Card>
    );
  }

  return <FallbackReportRenderer data={reportJson} />;
}
