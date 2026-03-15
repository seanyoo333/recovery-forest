/**
 * report_json → HTML 변환 유틸
 *
 * 건강보고서 report_json을 report_components 시각과 유사한 프리미엄 HTML로 변환하여
 * health_reports.report_html에 저장 (status=completed 시, PDF·미리보기 등에 사용)
 *
 * ⚠️ Tailwind 클래스 대신 인라인 스타일 사용:
 * - 저장된 HTML이 앱 외부(별도 파일, PDF 등)에서도 스타일이 적용되도록
 * - Tailwind purge/동적 클래스 미적용 문제 회피
 */
export type ReportJson = Record<string, unknown>;

/** 인라인 스타일 (report_components 시각과 유사한 값) */
const STYLES = {
  article: "font-family:ui-sans-serif,system-ui,sans-serif; color:#1a1a1a; line-height:1.6;",
  cover:
    "margin-bottom:1.5rem; padding:1.5rem 1.5rem 2rem; border:1px solid #e5e7eb; border-radius:1rem; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.05);",
  h1:
    "margin:0 0 0.5rem; font-size:1.875rem; font-weight:700; letter-spacing:-0.025em; color:#1a1a1a;",
  h2:
    "margin:0 0 1rem; font-size:1.5rem; font-weight:600; letter-spacing:-0.025em; color:#1a1a1a;",
  h3:
    "margin:0 0 0.5rem; font-size:1.125rem; font-weight:600; color:#374151;",
  p: "margin:0 0 0.75rem; font-size:1rem; line-height:1.75; color:#374151;",
  pMuted:
    "margin:0 0 0.75rem; font-size:0.875rem; line-height:1.75; color:#6b7280;",
  section:
    "margin:1.5rem 0; padding:1.5rem; border:1px solid #e5e7eb; border-radius:1rem; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.05);",
  sectionWarn:
    "margin:1.5rem 0; padding:1.5rem; border:1px solid #fecaca; border-radius:1rem; background:#fef2f2;",
  sectionAsk:
    "margin:1.5rem 0; padding:1.5rem; border:1px solid #bae6fd; border-radius:1rem; background:#f0f9ff;",
  sectionAction:
    "margin:1.5rem 0; padding:1.5rem; border:1px solid #a7f3d0; border-radius:1rem; background:#ecfdf5;",
  sectionMuted:
    "margin:1.5rem 0; padding:1.5rem; border:1px solid #e5e7eb; border-radius:1rem; background:#f9fafb;",
  footer:
    "margin-top:2rem; padding:1.25rem; border:1px solid #e5e7eb; border-radius:1rem; background:#f9fafb; font-size:0.875rem; color:#6b7280;",
  ul: "margin:0 0 1rem; padding-left:1.25rem; list-style:none;",
  li: "margin:0 0 0.5rem; padding-left:0; display:flex; gap:0.75rem; align-items:flex-start; font-size:0.875rem; line-height:1.5;",
  liBullet: "color:#0284c7; flex-shrink:0;",
} as const;

/** HTML 꺾쇠괄호 제거 (예: <...>) */
function stripAngleBrackets(s: string): string {
  return s.replace(/^<([^>]*)>$/i, "$1").trim() || s;
}

/** HTML 특수문자 이스케이프 (XSS 방지) */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 섹션 객체에서 title-content 블록 추출 */
function parseSectionBlocks(
  section: Record<string, unknown>,
): Array<{ title: string; content: string }> {
  const blocks: Array<{ title: string; content: string }> = [];
  const keys = Object.keys(section).filter(
    (k) => section[k] != null && typeof section[k] === "string",
  );
  let pendingTitle: string | null = null;

  for (const key of keys) {
    const val = String(section[key]).trim();
    if (!val) continue;

    const isContent =
      key.endsWith("_content") || key.endsWith("_explanation");
    const explicitTitle =
      isContent && key.endsWith("_content")
        ? (section[key.replace(/_content$/, "_title")] as string | undefined)
        : undefined;

    if (isContent) {
      const title =
        (typeof explicitTitle === "string" && explicitTitle.trim()) ||
        pendingTitle ||
        key.replace(/_content$|_explanation$/, "").replace(/_/g, " ");
      blocks.push({ title, content: val });
      pendingTitle = null;
    } else {
      pendingTitle = val;
    }
  }
  return blocks.filter((b) => b.content.length > 0);
}

/** 콘텐츠를 HTML <p> 블록으로 (인라인 스타일) */
function toParagraphs(content: string): string {
  return content
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="${STYLES.p}">${escapeHtml(p.trim().replace(/\n/g, " "))}</p>`,
    )
    .join("\n");
}

/** 리스트 항목 파싱 */
function parseListItems(text: string): string[] {
  return text
    .split(/[\n•▸\-]/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter((s) => s.length > 0);
}

/**
 * report_json을 프리미엄 HTML 문자열로 변환
 * report_components 시각과 유사한 인라인 스타일 적용
 */
export function reportJsonToHtml(
  data: ReportJson,
  options?: { createdAt?: string },
): string {
  if (!data || typeof data !== "object") return "";

  const title = stripAngleBrackets(
    (data.Title as string) ?? (data.title as string) ?? "맞춤 건강 보고서",
  );
  const starting = (data.starting_sentence as string) ?? "";
  const ending = (data.ending_sentence as string) ?? "";
  const context = (data.context as string[]) ?? [];
  const skipKeys = new Set([
    "Title",
    "title",
    "starting_sentence",
    "ending_sentence",
    "context",
    "html",
  ]);

  const sectionKeys = context.filter(
    (k) => typeof k === "string" && (data[k] as object),
  );
  const keys =
    sectionKeys.length > 0
      ? sectionKeys
      : Object.keys(data).filter(
          (k) => !skipKeys.has(k) && typeof data[k] === "object",
        );

  const parts: string[] = [];
  parts.push(`<article style="${STYLES.article}">`);

  // Cover
  parts.push(`<section style="${STYLES.cover}">`);
  parts.push(`<h1 style="${STYLES.h1}">${escapeHtml(title)}</h1>`);
  if (starting.trim()) {
    parts.push(
      `<p style="${STYLES.pMuted}">${escapeHtml(starting)}</p>`,
    );
  }
  if (options?.createdAt) {
    parts.push(
      `<p style="${STYLES.pMuted}">생성일: ${escapeHtml(options.createdAt)}</p>`,
    );
  }
  parts.push("</section>");

  for (const key of keys) {
    const section = data[key] as Record<string, unknown> | undefined;
    if (!section || typeof section !== "object") continue;

    const blocks = parseSectionBlocks(section);
    if (blocks.length === 0) continue;

    const firstBlock = blocks[0];
    const isWarnings =
      key.includes("sixth") || String(section.warnings ?? "").length > 0;
    const isAction = key.includes("forth") || key.includes("action");
    const isAskDoctor =
      key.includes("fifth") ||
      key.includes("things_to_ask") ||
      key.includes("interaction");

    if (isWarnings) {
      const sectionTitle = stripAngleBrackets(
        firstBlock?.title ?? "주의사항",
      );
      parts.push(`<section style="${STYLES.sectionWarn}">`);
      parts.push(
        `<h2 style="${STYLES.h2}">${escapeHtml(sectionTitle)}</h2>`,
      );
      for (const b of blocks) {
        if (b.content) parts.push(toParagraphs(b.content));
      }
      parts.push("</section>");
      continue;
    }

    if (isAskDoctor) {
      const items = blocks.flatMap((b) =>
        b.content ? parseListItems(b.content) : [],
      );
      const sectionTitle = stripAngleBrackets(
        firstBlock?.title ?? "담당 선생님께 여쭤볼 수 있는 질문",
      );
      parts.push(`<section style="${STYLES.sectionAsk}">`);
      parts.push(
        `<h2 style="${STYLES.h2}">${escapeHtml(sectionTitle)}</h2>`,
      );
      if (items.length > 0) {
        parts.push(`<ul style="${STYLES.ul}">`);
        items.forEach((item) => {
          parts.push(
            `<li style="${STYLES.li}"><span style="${STYLES.liBullet}">▸</span><span>${escapeHtml(item)}</span></li>`,
          );
        });
        parts.push("</ul>");
      } else {
        for (const b of blocks) {
          if (b.content) parts.push(toParagraphs(b.content));
        }
      }
      parts.push("</section>");
      continue;
    }

    const sectionTitle = stripAngleBrackets(firstBlock?.title ?? "섹션");
    const sectionStyle = isAction
      ? STYLES.sectionAction
      : STYLES.section;

    parts.push(`<section style="${sectionStyle}">`);
    parts.push(
      `<h2 style="${STYLES.h2}">${escapeHtml(sectionTitle)}</h2>`,
    );

    for (const b of blocks) {
      if (b.content) {
        if (blocks.length > 1 && b.title) {
          parts.push(
            `<h3 style="${STYLES.h3}">${escapeHtml(stripAngleBrackets(b.title))}</h3>`,
          );
        }
        parts.push(toParagraphs(b.content));
      }
    }
    parts.push("</section>");
  }

  if (ending.trim()) {
    parts.push(`<section style="${STYLES.sectionMuted}">`);
    parts.push(`<h2 style="${STYLES.h2}">마무리 안내</h2>`);
    parts.push(toParagraphs(ending));
    parts.push("</section>");
  }

  parts.push(`<footer style="${STYLES.footer}">`);
  parts.push(
    `<p style="margin:0; line-height:1.6;">본 리포트는 참고용 건강정보이며, 의료행위·진단·처방을 대체하지 않습니다. AI를 활용한 자동화된 분석 결과가 포함될 수 있습니다.</p>`,
  );
  parts.push("</footer>");

  parts.push("</article>");
  return parts.join("\n");
}
