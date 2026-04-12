export type ReportJson = Record<string, unknown>;

/** report_json이 건강보고서 구조인지 판별 */
export function isHealthReportStructure(data: ReportJson): boolean {
  if (!data || typeof data !== "object") return false;
  const hasTitle =
    typeof data.Title === "string" || typeof data.title === "string";
  const hasContext = Array.isArray(data.context);
  const hasSection = Object.keys(data).some(
    (key) => key.includes("section") && typeof data[key] === "object",
  );
  return hasTitle || hasContext || hasSection;
}

/** 섹션 객체에서 title-content 블록 추출 */
export function parseSectionBlocks(
  section: Record<string, unknown>,
): Array<{ title: string; content: string }> {
  const blocks: Array<{ title: string; content: string }> = [];
  const keys = Object.keys(section).filter(
    (key) => section[key] != null && typeof section[key] === "string",
  );
  let pendingTitle: string | null = null;

  for (const key of keys) {
    const value = String(section[key]).trim();
    if (!value) continue;

    const isContent = key.endsWith("_content") || key.endsWith("_explanation");
    const explicitTitle =
      isContent && key.endsWith("_content")
        ? (section[key.replace(/_content$/, "_title")] as string | undefined)
        : undefined;

    if (isContent) {
      const title =
        (typeof explicitTitle === "string" && explicitTitle.trim()) ||
        pendingTitle ||
        key.replace(/_content$|_explanation$/, "").replace(/_/g, " ");
      blocks.push({ title, content: value });
      pendingTitle = null;
    } else {
      pendingTitle = value;
    }
  }

  return blocks.filter((block) => block.content.length > 0);
}

/** HTML 태그 제거 (예: <...>) */
export function stripAngleBrackets(s: string): string {
  return s.replace(/^<([^>]*)>$/i, "$1").trim() || s;
}

/** 줄바꿈/불릿으로 구분된 항목 파싱 */
export function parseListItems(text: string): string[] {
  return text
    .split(/[\n•▸\-]/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter((s) => s.length > 0);
}

export type ReportContentAvailability = {
  hasMdxCode: boolean;
  hasPremiumReportData: boolean;
  hasSavedHtml: boolean;
  hasRenderableContent: boolean;
};

export function getReportContentAvailability({
  reportJson,
  reportHtml,
  mdxCode,
}: {
  reportJson: ReportJson | null;
  reportHtml: string | null;
  mdxCode: string | null;
}): ReportContentAvailability {
  const hasMdxCode = !!mdxCode;
  const hasPremiumReportData = !!(
    reportJson && isHealthReportStructure(reportJson)
  );
  const hasSavedHtml = typeof reportHtml === "string" && reportHtml.trim().length > 0;
  return {
    hasMdxCode,
    hasPremiumReportData,
    hasSavedHtml,
    hasRenderableContent: hasMdxCode || hasPremiumReportData || hasSavedHtml,
  };
}
