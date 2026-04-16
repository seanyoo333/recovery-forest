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
  | "references"
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
  seventhSection?: ReportSection;
};

type CanonicalSectionKey =
  | "first_section"
  | "second_section"
  | "third_section"
  | "forth_section"
  | "fifth_section"
  | "sixth_section"
  | "seventh_section";

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
    label: "관련 바이오 표적 및 핵심 영역",
    sectionKey: "second_section",
  },
  {
    id: "evidence",
    step: "3",
    label: "현재 상황 해석 근거와 의미",
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
    label: "통합의학 상담 시 질문 내용",
    sectionKey: "fifth_section",
  },
  {
    id: "warnings",
    step: "6",
    label: "주의사항",
    sectionKey: "sixth_section",
  },
  {
    id: "references",
    step: "7",
    label: "근거자료",
    sectionKey: "seventh_section",
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
  seventh_section: "references",
  closing: "closing",
  ending: "closing",
};

const SECTION_PREFIX_ALIASES: Record<CanonicalSectionKey, string[]> = {
  first_section: ["first_section_"],
  second_section: ["second_section_"],
  third_section: ["third_section_"],
  forth_section: ["forth_section_", "fourth_section_"],
  fifth_section: ["fifth_section_"],
  sixth_section: ["sixth_section_"],
  seventh_section: ["seventh_section_"],
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
  { keyword: "관련바이오표적및핵심영역", id: "target-axis" },
  { keyword: "현재상황해석근거와의미", id: "evidence" },
  { keyword: "통합의학상담시질문내용", id: "consultation" },
  { keyword: "근거자료", id: "references" },
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
      return hasSectionPayload(model.sections.secondSection);
    case "evidence":
      return hasSectionPayload(model.sections.thirdSection);
    case "action-guide":
      return hasSectionPayload(model.sections.fourthSection);
    case "consultation":
      return hasSectionPayload(model.sections.fifthSection);
    case "warnings":
      return hasSectionPayload(model.sections.sixthSection);
    case "references":
      return hasSectionPayload(model.sections.seventhSection);
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
  const keys = new Set<string>();
  const context = (data.context as string[]) ?? [];
  const keysFromContext = context
    .map((key) => normalizeSectionKey(key))
    .filter(
      (key) =>
        typeof key === "string" &&
        ((typeof data[key] === "object" && data[key] !== null) ||
          (SECTION_PREFIX_ALIASES[key as CanonicalSectionKey]?.some((prefix) =>
            Object.keys(data).some((candidate) => candidate.startsWith(prefix)),
          ) ??
            false)),
    );

  for (const key of keysFromContext) {
    keys.add(key);
  }

  for (const [sectionKey, prefixes] of Object.entries(SECTION_PREFIX_ALIASES)) {
    if (
      prefixes.some((prefix) =>
        Object.keys(data).some((candidate) => candidate.startsWith(prefix)),
      )
    ) {
      keys.add(sectionKey);
    }
  }

  if (keys.size > 0) {
    return keys;
  }

  return new Set([
    ...Object.keys(data).filter(
      (key) =>
        !REPORT_META_KEYS.has(key) &&
        typeof data[key] === "object" &&
        data[key] !== null,
    ),
    ...Object.keys(SECTION_PREFIX_ALIASES).filter((sectionKey) =>
      SECTION_PREFIX_ALIASES[sectionKey as CanonicalSectionKey].some((prefix) =>
        Object.keys(data).some((candidate) => candidate.startsWith(prefix)),
      ),
    ),
  ]);
}

function extractPrefixedSectionFields(
  data: ReportJson,
  prefixes: string[],
): ReportSection | undefined {
  const section: ReportSection = {};

  for (const [rawKey, value] of Object.entries(data)) {
    const matchedPrefix = prefixes.find((prefix) => rawKey.startsWith(prefix));
    if (!matchedPrefix) continue;

    const subKey = rawKey.slice(matchedPrefix.length).trim();
    if (!subKey) continue;
    section[subKey] = value;
  }

  return Object.keys(section).length > 0 ? section : undefined;
}

function resolveSectionData(
  data: ReportJson,
  canonicalKey: CanonicalSectionKey,
): ReportSection | undefined {
  const nested =
    typeof data[canonicalKey] === "object" && data[canonicalKey] !== null
      ? (data[canonicalKey] as ReportSection)
      : undefined;
  const prefixed = extractPrefixedSectionFields(
    data,
    SECTION_PREFIX_ALIASES[canonicalKey],
  );

  if (!nested && !prefixed) return undefined;
  return {
    ...(nested ?? {}),
    ...(prefixed ?? {}),
  };
}

function getPremiumReportSections(data: ReportJson): PremiumReportSections {
  return {
    firstSection: resolveSectionData(data, "first_section"),
    secondSection: resolveSectionData(data, "second_section"),
    thirdSection: resolveSectionData(data, "third_section"),
    fourthSection: resolveSectionData(data, "forth_section"),
    fifthSection: resolveSectionData(data, "fifth_section"),
    sixthSection: resolveSectionData(data, "sixth_section"),
    seventhSection: resolveSectionData(data, "seventh_section"),
  };
}

function isOverviewSummaryTitle(title: string | undefined): boolean {
  return OVERVIEW_SUMMARY_TITLE_ALIASES.includes((title ?? "").toLowerCase());
}

function normalizeDedupeKey(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function dedupeQuestionLines(lines: string[]): string[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const key = normalizeDedupeKey(trimmed);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 상담 질문: things_to_ask 전용 (다른 DB 필드와 합치지 않음 → 중복 방지) */
function getThingsToAskQuestions(section: ReportSection): string[] {
  const raw = pickFirstNonEmptyString(section, [
    "things_to_ask",
    "fifth_section_things_to_ask",
  ]);
  if (!raw) return [];
  return dedupeQuestionLines(parseListItems(raw));
}

function textsAreEquivalent(a: string, b: string): boolean {
  return normalizeDedupeKey(a) === normalizeDedupeKey(b);
}

function filterConsultationExtraBlocks(
  blocks: Array<{ title: string; content: string }>,
  alreadyShown: string[],
): Array<{ title: string; content: string }> {
  const norms = alreadyShown
    .map((t) => normalizeDedupeKey(t))
    .filter((t) => t.length > 0);
  return blocks.filter(({ content }) => {
    const c = normalizeDedupeKey(content);
    if (!c) return false;
    return !norms.some((n) => c === n || (c.length > 24 && n.length > 24 && (c.includes(n) || n.includes(c))));
  });
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

function parseSectionBlocksFlexible(
  section: ReportSection,
): Array<{ title: string; content: string }> {
  const parsed = parseSectionBlocks(section);
  const fallback = Object.entries(section)
    .filter(
      ([key, value]) =>
        key !== "title" &&
        typeof value === "string" &&
        value.trim().length > 0 &&
        !key.endsWith("_title"),
    )
    .map(([key, value]) => ({
      title: stripAngleBrackets(key.replace(/_/g, " ").trim()),
      content: String(value).trim(),
    }));

  if (parsed.length === 0) {
    return fallback;
  }

  const existing = new Set(parsed.map((item) => `${item.title}|${item.content}`));
  return [
    ...parsed,
    ...fallback.filter(
      (item) => !existing.has(`${item.title}|${item.content}`),
    ),
  ];
}

function parseBracketedSubsections(content: string): Array<{ title: string; content: string }> {
  const raw = content.trim();
  if (!raw) return [];

  const matches = [...raw.matchAll(/\[([^\]]+)\]/g)];
  if (!matches.length) return [];

  const blocks: Array<{ title: string; content: string }> = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const next = matches[i + 1];
    const title = stripAngleBrackets((match[1] ?? "").trim());
    const start = (match.index ?? 0) + match[0].length;
    const end = next?.index ?? raw.length;
    const text = raw
      .slice(start, end)
      .trim()
      .replace(/^[:\-\s]+/, "");
    if (!title || !text) continue;
    blocks.push({ title, content: text });
  }
  return blocks;
}

function parseAvoidChecklistItems(content: string): string[] {
  const normalizedContent = content.replace(/\\n/g, "\n");
  const lines = normalizedContent
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const numberedItemStartRe = /^(\d+)\s*[\.\)]\s*(.+)$/;
  const firstItemStartIndex = lines.findIndex((line) =>
    numberedItemStartRe.test(line),
  );
  const targetLines =
    firstItemStartIndex >= 0 ? lines.slice(firstItemStartIndex) : lines;

  const items: string[] = [];
  let current = "";

  for (const line of targetLines) {
    const matched = line.match(numberedItemStartRe);
    if (matched) {
      if (current) items.push(current.trim());
      current = matched[2]?.trim() ?? "";
      continue;
    }

    if (current) {
      current = `${current}\n${line}`;
    } else {
      current = line;
    }
  }

  if (current) items.push(current.trim());

  const normalizedSeen = new Set<string>();
  const deduped = items.filter((item) => {
    const normalized = item.replace(/\s+/g, " ").trim();
    if (!normalized || normalizedSeen.has(normalized)) return false;
    normalizedSeen.add(normalized);
    return true;
  });

  if (deduped.length > 0) return deduped.slice(0, 3);
  return parseListItems(normalizedContent).slice(0, 3);
}

function extractUrls(content: string): string[] {
  const matches = content.match(/https?:\/\/[^\s<>"')\]]+/g) ?? [];
  return [...new Set(matches)];
}

type ReferenceEntry = {
  label: string;
  href: string;
  paper_title?: string;
  description?: string;
  rationale?: string;
  study_type?: string;
};

function safeReferenceHostname(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function sanitizeReferenceLabel(label: string, href: string): string {
  const t = label.trim();
  if (!t) return href;
  if (/url\s*\(\s*제공된\s*링크\s*\)/i.test(t)) return href;
  if (/^제공된\s*링크$/i.test(t)) return href;
  const stripped = t.replace(/^\s*url\s*\(\s*제공된\s*링크\s*\)\s*:?\s*/i, "").trim();
  if (!stripped) return href;
  if (/url\s*\(\s*제공된\s*링크\s*\)/i.test(stripped)) return href;
  return stripped;
}

function sanitizeReferenceDescription(desc: string): string | undefined {
  let t = desc.trim();
  if (!t) return undefined;
  t = t.replace(/^url\s*\(\s*제공된\s*링크\s*\)\s*:?\s*/i, "").trim();
  if (!t || /^url\s*\(\s*제공된\s*링크\s*\)/i.test(t)) return undefined;
  return t;
}

/** 본문 끝에 붙은 '-Study_type: …' / 'study_type: …'을 분리 (DB 한 필드로 올 때) */
function splitRationaleAndEmbeddedStudyType(
  rationale: string,
  existingStudyType?: string,
): { rationale: string; study_type?: string } {
  const existing = existingStudyType?.trim();
  if (existing) {
    return { rationale: rationale.trim() };
  }
  const t = rationale.trim();
  const patterns: RegExp[] = [
    /(?:\n|\r\n)\s*[-–—]?\s*Study_type\s*[:：]\s*(.+)$/is,
    /\s+[-–—]?\s*Study_type\s*[:：]\s*(.+)$/i,
    /(?:\n|\r\n)\s*study_type\s*[:：]\s*(.+)$/is,
    /\s+study_type\s*[:：]\s*(.+)$/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m?.[1]) {
      const studyType = m[1].trim();
      const head = t.slice(0, m.index).trim();
      if (head && studyType) {
        return { rationale: head, study_type: studyType };
      }
    }
  }
  return { rationale: t };
}

function finalizeReferenceEntry(entry: ReferenceEntry): ReferenceEntry {
  const label = sanitizeReferenceLabel(entry.label, entry.href);
  const description = entry.description
    ? sanitizeReferenceDescription(entry.description)
    : undefined;

  let rationale = entry.rationale?.trim();
  let study_type = entry.study_type?.trim();

  if (rationale) {
    const split = splitRationaleAndEmbeddedStudyType(rationale, study_type);
    rationale = split.rationale;
    if (!study_type && split.study_type) {
      study_type = split.study_type;
    }
  }

  const { paper_title: rawPaperTitle, ...restEntry } = entry;
  const paper_title = rawPaperTitle?.trim();

  return {
    ...restEntry,
    label,
    ...(description ? { description } : {}),
    ...(rationale ? { rationale } : {}),
    ...(study_type ? { study_type } : {}),
    ...(paper_title ? { paper_title } : {}),
  };
}

function normalizeReferenceObject(o: Record<string, unknown>): ReferenceEntry | null {
  const href = String(o.url ?? o.href ?? o.link ?? "").trim();
  if (!/^https?:\/\//i.test(href)) return null;
  const rawLabel = String(o.title ?? o.label ?? o.name ?? o.source ?? "").trim();
  const explicitPaperTitle = String(
    o.paper_title ??
      o.article_title ??
      o.publication_title ??
      o.paper_name ??
      o.journal_article_title ??
      ""
  ).trim();
  const inferredPaperTitle =
    !explicitPaperTitle &&
    rawLabel &&
    !/^https?:\/\//i.test(rawLabel) &&
    rawLabel.length > 1
      ? rawLabel
      : "";
  const paper_title = explicitPaperTitle || inferredPaperTitle || undefined;
  const rawDescription = String(
    o.description ?? o.summary ?? o.abstract ?? o.what ?? "",
  ).trim();
  const rationale = String(
    o.rationale ?? o.why ?? o.selection_reason ?? o.reason ?? o.note ?? "",
  ).trim();
  const study_type = String(o.study_type ?? o.studyType ?? "").trim();
  return finalizeReferenceEntry({
    label: rawLabel || safeReferenceHostname(href),
    href,
    ...(paper_title ? { paper_title } : {}),
    ...(rawDescription ? { description: rawDescription } : {}),
    ...(rationale ? { rationale } : {}),
    ...(study_type ? { study_type } : {}),
  });
}

function dedupeReferenceEntries(items: ReferenceEntry[]): ReferenceEntry[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function tryParseReferencesJsonArray(section: ReportSection): ReferenceEntry[] | null {
  const keys = [
    "references_json",
    "references_structured",
    "reference_items",
    "seventh_section_references_json",
  ];
  for (const key of keys) {
    const raw = section[key];
    if (raw == null) continue;
    let arr: unknown;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (!t.startsWith("[") && !t.startsWith("{")) continue;
      try {
        arr = JSON.parse(t);
      } catch {
        continue;
      }
    } else if (Array.isArray(raw)) {
      arr = raw;
    } else {
      continue;
    }
    const list = Array.isArray(arr) ? arr : (arr as { references?: unknown }).references;
    if (!Array.isArray(list)) continue;
    const out: ReferenceEntry[] = [];
    for (const item of list) {
      if (item && typeof item === "object") {
        const n = normalizeReferenceObject(item as Record<string, unknown>);
        if (n) out.push(n);
      }
    }
    if (out.length) return dedupeReferenceEntries(out);
  }
  return null;
}

function parseReferencesFromPlainBlob(text: string): ReferenceEntry[] {
  const normalized = text.replace(/\\n/g, "\n").trim();
  if (!normalized) return [];

  if (normalized.startsWith("[") || normalized.startsWith("{")) {
    try {
      const parsed = JSON.parse(normalized) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : parsed &&
            typeof parsed === "object" &&
            Array.isArray((parsed as { references?: unknown }).references)
          ? (parsed as { references: unknown[] }).references
          : null;
      if (Array.isArray(list)) {
        const out: ReferenceEntry[] = [];
        for (const item of list) {
          if (item && typeof item === "object") {
            const n = normalizeReferenceObject(item as Record<string, unknown>);
            if (n) out.push(n);
          }
        }
        if (out.length) return dedupeReferenceEntries(out);
      }
    } catch {
      // plain text below
    }
  }

  const paragraphs = normalized.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const byPara: ReferenceEntry[] = [];
  const seen = new Set<string>();

  for (const para of paragraphs) {
    const urls = extractUrls(para);
    if (!urls.length) continue;
    const href = urls[0];
    if (seen.has(href)) continue;
    seen.add(href);

    const lines = para.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const nonUrlLines = lines.filter((l) => extractUrls(l).length === 0);
    const urlLine = lines.find((l) => l.includes(href));
    let label = "";
    if (urlLine) {
      label = urlLine
        .slice(0, urlLine.indexOf(href))
        .replace(/^[\d\.\)\s\-•]+/, "")
        .replace(/[\s\-•]+$/, "")
        .trim();
    }
    if (!label && nonUrlLines.length > 0) {
      label = nonUrlLines[0] ?? "";
    }
    if (!label || label.length < 2) {
      label = safeReferenceHostname(href);
    }

    let rationale: string | undefined;
    if (nonUrlLines.length > 1) {
      rationale = nonUrlLines.slice(1).join("\n").trim();
    } else if (nonUrlLines.length === 1 && urlLine && !nonUrlLines[0].includes(href)) {
      rationale = nonUrlLines[0];
    } else {
      const idx = lines.findIndex((l) => l.includes(href));
      const afterUrl = lines
        .slice(idx + 1)
        .filter((l) => extractUrls(l).length === 0)
        .join("\n")
        .trim();
      if (afterUrl) rationale = afterUrl;
    }

    byPara.push({
      label,
      href,
      ...(rationale ? { rationale } : {}),
    });
  }

  if (byPara.length) return dedupeReferenceEntries(byPara);

  const linear: ReferenceEntry[] = [];
  seen.clear();
  for (const line of normalized.split("\n")) {
    const urls = extractUrls(line);
    for (const href of urls) {
      if (seen.has(href)) continue;
      seen.add(href);
      let label = line
        .replace(href, "")
        .replace(/^[\d\.\)\s\-•]+|[\s\-•]+$/g, "")
        .trim();
      if (label.length < 2) label = safeReferenceHostname(href);
      linear.push({ label, href });
    }
  }
  return dedupeReferenceEntries(linear);
}

function buildReferenceEntries(
  section: ReportSection,
  referencesText: string,
): ReferenceEntry[] {
  const structured = tryParseReferencesJsonArray(section);
  if (structured?.length) return structured;
  if (referencesText.trim()) {
    return dedupeReferenceEntries(
      parseReferencesFromPlainBlob(referencesText).map(finalizeReferenceEntry),
    );
  }
  return [];
}

function resolveSectionHeading(
  section: ReportSection | undefined,
  fallback: string,
): string {
  const heading = pickFirstNonEmptyString(section, ["title", "section_title"]);
  return stripAngleBrackets(heading || fallback);
}

function mergeFixedAndDbSectionTitle(
  fixedTitle: string,
  dbTitle?: string,
): string {
  if (!dbTitle) return fixedTitle;
  const normalizedFixed = sanitizeTocLabel(fixedTitle)
    .toLowerCase()
    .replace(/\s+/g, "");
  const normalizedDb = sanitizeTocLabel(dbTitle)
    .toLowerCase()
    .replace(/\s+/g, "");
  if (!normalizedDb || normalizedFixed === normalizedDb) {
    return fixedTitle;
  }
  return `${fixedTitle} - ${dbTitle}`;
}

function resolveTimelineText(
  section: ReportSection,
  keyBase: "goal_action" | "goal_7d_action" | "goal_8w_action",
  fallbackTitle: string,
): { title: string; content: string } {
  const rawTitle = pickFirstNonEmptyString(section, [`${keyBase}_title`, keyBase]);
  const rawContent = pickFirstNonEmptyString(section, [`${keyBase}_content`]);

  if (rawContent) {
    return {
      title: stripAngleBrackets(rawTitle || fallbackTitle),
      content: rawContent,
    };
  }

  return {
    title: fallbackTitle,
    content: rawTitle,
  };
}

function hasSectionPayload(section: ReportSection | undefined): boolean {
  if (!section) return false;
  return Object.values(section).some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  });
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
      contentKeys: ["general_health_content", "general_health"],
      prefix: "1. 일반기록 기반 건강 정보:",
      variant: "default",
    },
    {
      titleKeys: ["blood_health_title"],
      contentKeys: ["blood_health_content", "blood_health"],
      prefix: "2. 혈액검사 기반 건강 정보:",
      variant: "clinical",
    },
    {
      titleKeys: ["routine_healthi_title", "routine_health_title"],
      contentKeys: [
        "routine_healthi_content",
        "routine_health_content",
        "routine_health",
      ],
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
        "top_concerns_related_advice",
        "total_individualized_summary",
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

  return parseSectionBlocksFlexible(firstSection)
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
  const overviewHeading = resolveSectionHeading(
    model.sections.firstSection,
    "현재 상태 한눈에 보기",
  );

  return (
    <ReportAnchorSection id="overview">
      <SectionCard
        step="1"
        title={mergeFixedAndDbSectionTitle("현재 상태 한눈에 보기", overviewHeading)}
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

/** 2. 관련 바이오 표적 및 핵심 영역 */
function TargetAxisSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.secondSection;
  if (!section) return null;

  const primaryAxis = pickFirstNonEmptyString(section, [
    "major_targets_axis",
    "major_axis",
    "major_targets_axis_content",
    "major_targets_axis_title",
    "title",
  ]);
  const secondaryAxis = pickFirstNonEmptyString(section, [
    "second_major_target_axis",
    "second_major_target_axis_content",
    "second_major_axis",
  ]);
  const practicalAdvice = pickFirstNonEmptyString(section, [
    "practical_advices",
    "practical_advices_content",
    "practical_advice",
    "targets_axis_explanation",
    "targets_axis_explanation_content",
  ]);
  const normalizedPrimaryAxis = stripAngleBrackets(primaryAxis || "종합");
  const normalizedSecondaryAxis = secondaryAxis
    ? stripAngleBrackets(secondaryAxis)
    : undefined;
  const normalizedPracticalAdvice =
    practicalAdvice || normalizedSecondaryAxis || normalizedPrimaryAxis;

  return (
    <ReportAnchorSection id="target-axis">
      <SectionCard
        step="2"
        title={mergeFixedAndDbSectionTitle(
          "관련 바이오 표적 및 핵심 영역",
          resolveSectionHeading(section, "관련 바이오 표적 및 핵심 영역"),
        )}
        description="우선적으로 살펴볼 바이오마커와 생활습관 포인트입니다."
      >
        <PriorityTargetCard
          primaryAxis={normalizedPrimaryAxis}
          secondaryAxis={normalizedSecondaryAxis}
          practicalAdvice={normalizedPracticalAdvice}
          symptoms={[]}
          targets={[]}
        />
      </SectionCard>
    </ReportAnchorSection>
  );
}

/** 3. 현재 상황 해석 근거와 의미 */
function EvidenceSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.thirdSection;
  if (!section) return null;

  const mechanisticPaper = pickFirstNonEmptyString(section, [
    "mechanistic_paper",
    "top_paper_research_content",
  ]);
  const clinicalPaper = pickFirstNonEmptyString(section, [
    "clinical_paper",
    "relation_content",
  ]);
  const customizedBlog = pickFirstNonEmptyString(section, [
    "customized_blog",
    "top_blog_content",
  ]);
  const dedupeEvidenceText = (
    value: string,
    seen: Set<string>,
  ): string => {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized) return "";
    if (seen.has(normalized)) return "";
    seen.add(normalized);
    return value;
  };
  const usedEvidence = new Set<string>();
  const mechanisticContent = dedupeEvidenceText(mechanisticPaper, usedEvidence);
  const clinicalContent = dedupeEvidenceText(clinicalPaper, usedEvidence);
  const blogContent = dedupeEvidenceText(customizedBlog, usedEvidence);
  const hasBridgeData =
    mechanisticContent ||
    clinicalContent ||
    blogContent ||
    section.relation_between_targets_status != null ||
    section.top_paper_research != null;

  return (
    <ReportAnchorSection id="evidence">
      <SectionCard
        step="3"
        title={mergeFixedAndDbSectionTitle(
          "현재 상황 해석 근거와 의미",
          resolveSectionHeading(section, "현재 상황 해석 근거와 의미"),
        )}
        description="표적과 생활습관 연결 근거, 관련 논문·리소스 요약입니다."
      >
        {hasBridgeData ? (
          <EvidenceBridge
            relationTitle={
              stripAngleBrackets(
                (section.relation_between_targets_status as string) ??
                  "표적-축 기전설명 논문 소개",
              ).startsWith("1.")
                ? stripAngleBrackets(
                    (section.relation_between_targets_status as string) ??
                      "표적-축 기전설명 논문 소개",
                  )
                : `1. ${stripAngleBrackets(
                    (section.relation_between_targets_status as string) ??
                      "표적-축 기전설명 논문 소개",
                  )}`
            }
            relationContent={mechanisticContent}
            paperSummaryTitle={
              stripAngleBrackets(
                (section.top_paper_research as string) ?? "관련 임상 논문 소개",
              ).startsWith("2.")
                ? stripAngleBrackets(
                    (section.top_paper_research as string) ?? "관련 임상 논문 소개",
                  )
                : `2. ${stripAngleBrackets(
                    (section.top_paper_research as string) ?? "관련 임상 논문 소개",
                  )}`
            }
            paperSummary={clinicalContent}
            relevanceTitle="3. 개인맞춤 블로그 섹션"
            relevanceContent={blogContent}
            relevanceBlocks={parseBracketedSubsections(blogContent)}
            extraEvidenceTitle={undefined}
            extraEvidenceContent={undefined}
          />
        ) : (
          <div className="space-y-4">
            {parseSectionBlocksFlexible(section).map((block, index) => (
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
  if (!section) return null;

  const firstWeek = resolveTimelineText(section, "goal_7d_action", "4-1. 7일 실행");
  const eightWeek = resolveTimelineText(section, "goal_8w_action", "4-2. 8주 실행");
  const avoidTitleRaw = pickFirstNonEmptyString(section, [
    "must_avoid_title",
    "things_to_avoid_title",
    "avoid_3_title",
    "avoidance_title",
    "avoid_title",
  ]);
  const avoidContent = pickFirstNonEmptyString(section, [
    "forth_section_things_3_must_avoid",
    "things_3_must_avoid",
    "things_3_must_avoid_content",
    "must_avoid_3",
    "must_avoid",
    "things_to_avoid",
    "avoid_3_items",
    "avoid_3",
    "avoidance",
    "goal_avoid",
    "avoid_list",
    "donts",
    "warnings",
    "cautions",
  ]);
  const avoidChecklist = parseAvoidChecklistItems(avoidContent);
  const avoidTitle = (() => {
    const title = stripAngleBrackets(avoidTitleRaw || "4-3. 꼭 피해야 할 3가지");
    return /^\s*4-3[\.\s]/.test(title) ? title : `4-3. ${title}`;
  })();

  return (
    <ReportAnchorSection id="action-guide">
      <SectionCard
        step="4"
        title={mergeFixedAndDbSectionTitle(
          "실행 가이드",
          resolveSectionHeading(section, "실행 가이드"),
        )}
        description="7일·8주 실행과 반드시 피해야 할 행동을 정리했습니다."
      >
        <ActionTimeline
          firstWeekTitle={firstWeek.title}
          firstWeekContent={firstWeek.content}
          eightWeekTitle={eightWeek.title}
          eightWeekContent={eightWeek.content}
          avoidTitle={avoidTitle}
          avoidContent={
            avoidContent || "무리한 변경, 과도한 제한, 중단/재개 반복은 피하세요."
          }
          avoidChecklist={avoidChecklist}
        />
      </SectionCard>
    </ReportAnchorSection>
  );
}

/** 5. 통합의학 상담 시 질문 내용 */
function ConsultationSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.fifthSection;
  if (!section) return null;

  const synergisticSuggestion = pickFirstNonEmptyString(section, [
    "synergistic_suggestion",
  ]);
  const currentInteraction = pickFirstNonEmptyString(section, [
    "current_interaction_content",
    "current_interaction",
  ]);
  const suggestedInteraction = pickFirstNonEmptyString(section, [
    "suggested_interaction_content",
    "suggested_interaction",
  ]);
  const evidenceSources = pickFirstNonEmptyString(section, ["evidence_sources"]);
  const questions = getThingsToAskQuestions(section);
  const askIntro = pickFirstNonEmptyString(section, [
    "things_to_ask_intro",
    "consultation_intro",
  ]);

  const suggestedDiffersFromEvidence =
    suggestedInteraction &&
    evidenceSources &&
    !textsAreEquivalent(suggestedInteraction, evidenceSources);

  const shownForExtraBlocks = [
    synergisticSuggestion,
    currentInteraction,
    suggestedInteraction,
    evidenceSources,
    ...(questions.length ? [pickFirstNonEmptyString(section, ["things_to_ask", "fifth_section_things_to_ask"]) ?? ""] : []),
  ].filter(Boolean) as string[];

  const extraBlocks = filterConsultationExtraBlocks(
    parseSectionBlocksFlexible(section),
    shownForExtraBlocks,
  );

  if (
    questions.length > 0 &&
    !synergisticSuggestion &&
    !currentInteraction &&
    !suggestedInteraction &&
    !evidenceSources &&
    extraBlocks.length === 0
  ) {
    return (
      <ReportAnchorSection id="consultation">
        <DoctorQuestionBox
          step="5"
          title={mergeFixedAndDbSectionTitle(
            "통합의학 상담 시 질문 내용",
            resolveSectionHeading(section, "통합의학 상담 시 질문 내용"),
          )}
          intro={askIntro || undefined}
          questions={questions}
        />
      </ReportAnchorSection>
    );
  }

  return (
    <ReportAnchorSection id="consultation">
      <SectionCard
        step="5"
        title={mergeFixedAndDbSectionTitle(
          "통합의학 상담 시 질문 내용",
          resolveSectionHeading(section, "통합의학 상담 시 질문 내용"),
        )}
        description="담당 선생님과 상의할 때 참고하실 수 있는 내용입니다."
      >
        <div className="space-y-4">
          {synergisticSuggestion ? (
            <InsightPanel
              title="5-1. 시너지 제안"
              content={synergisticSuggestion}
              variant="default"
            />
          ) : null}
          {currentInteraction ? (
            <InsightPanel
              title="5-2. 현재 상호작용 체크"
              content={currentInteraction}
              variant="default"
            />
          ) : null}
          {suggestedDiffersFromEvidence ? (
            <InsightPanel
              title="5-3. 추천 상호작용"
              content={suggestedInteraction}
              variant="default"
            />
          ) : null}
          {evidenceSources ? (
            <InsightPanel
              title={
                suggestedDiffersFromEvidence
                  ? "5-4. 근거 출처 요약"
                  : suggestedInteraction &&
                      textsAreEquivalent(suggestedInteraction, evidenceSources)
                    ? "5-3. 근거·추천 상호작용"
                    : "5-3. 근거 출처 요약"
              }
              content={evidenceSources}
              variant="default"
            />
          ) : suggestedInteraction && !evidenceSources ? (
            <InsightPanel
              title="5-3. 추천 상호작용"
              content={suggestedInteraction}
              variant="default"
            />
          ) : null}
          {questions.length > 0 ? (
            <DoctorQuestionBox
              step={undefined}
              title="5-5. 상담 시 물어볼 질문"
              intro={askIntro || undefined}
              questions={questions}
            />
          ) : null}
          {extraBlocks.map((block, index) => (
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
  if (!section) return null;

  const warningItems = parseListItems(
    (section.warnings_content as string) ?? (section.warnings as string) ?? "",
  );

  return (
    <ReportAnchorSection id="warnings">
      <WarningPanel
        step="6"
        title={mergeFixedAndDbSectionTitle(
          "주의사항",
          resolveSectionHeading(section, "주의사항"),
        )}
        items={warningItems}
      />
    </ReportAnchorSection>
  );
}

/** 7. 근거자료 */
function ReferencesSection({ model }: { model: PremiumReportModel }) {
  const section = model.sections.seventhSection;
  if (!section) return null;

  const referencesIntro = pickFirstNonEmptyString(section, [
    "references_intro",
    "reference_intro",
    "seventh_section_intro",
    "references_overview",
    "references_purpose",
    "seventh_section_purpose",
    "references_about",
  ]);
  const selectionRationale = pickFirstNonEmptyString(section, [
    "references_selection_rationale",
    "reference_selection_rationale",
    "why_these_references",
    "references_why",
    "seventh_section_selection_rationale",
    "references_selection_note",
    "reference_selection_note",
  ]);
  const referencesText = pickFirstNonEmptyString(section, [
    "references",
    "seventh_section_references",
    "reference_list_text",
  ]);

  const referenceItems = buildReferenceEntries(section, referencesText);
  const hasStructuredRefs = referenceItems.length > 0;
  const hasIntroOrRationale = !!(referencesIntro || selectionRationale);
  const hasLegacyText = !!referencesText.trim();

  if (!hasStructuredRefs && !hasIntroOrRationale && !hasLegacyText) {
    return (
      <ReportAnchorSection id="references">
        <SectionCard
          step="7"
          title={mergeFixedAndDbSectionTitle(
            "근거자료",
            resolveSectionHeading(section, "근거자료"),
          )}
          description="입력된 자료를 기준으로 핵심 근거를 정리했습니다."
        >
          <p className="text-muted-foreground text-sm leading-relaxed">
            현재 입력 정보 기준으로는 제한적으로 판단됩니다. 리포트 생성 시점의
            구조화 데이터가 확장되면 이 영역에서 더 구체적인 근거 목록을 확인하실 수
            있습니다.
          </p>
        </SectionCard>
      </ReportAnchorSection>
    );
  }

  return (
    <ReportAnchorSection id="references">
      <SectionCard
        step="7"
        title={mergeFixedAndDbSectionTitle(
          "근거자료",
          resolveSectionHeading(section, "근거자료"),
        )}
        description="참고자료의 요지와 선별 이유를 함께 확인할 수 있습니다."
      >
        <div className="space-y-4">
          {referencesIntro ? (
            <InsightPanel
              title="참고자료 안내"
              content={referencesIntro}
              variant="default"
            />
          ) : null}
          {selectionRationale ? (
            <InsightPanel
              title="참고자료 선별 기준"
              content={selectionRationale}
              variant="default"
            />
          ) : null}
          {hasStructuredRefs ? (
            <ReferenceList items={referenceItems} embedded />
          ) : hasLegacyText ? (
            <InsightPanel
              title="근거·참고 요약"
              content={referencesText}
              variant="default"
            />
          ) : null}
        </div>
      </SectionCard>
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
      <ReferencesSection model={model} />
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
