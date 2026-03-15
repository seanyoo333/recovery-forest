/**
 * report_json → MDX 변환 유틸
 *
 * 건강보고서 report_json을 블로그 스타일 MDX 문자열로 변환하여
 * SummaryBox, Callout, WarningBox, AskDoctorList, ReferenceList 등 재사용
 */
export type ReportJson = Record<string, unknown>;

/** HTML 꺾쇠괄호 제거 (예: <...>) */
function stripAngleBrackets(s: string): string {
  return s.replace(/^<([^>]*)>$/i, "$1").trim() || s;
}

/** MDX 내 { } 이스케이프 - JSX 표현식 충돌 방지 */
function escapeMdx(s: string): string {
  return s.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

/** JSX 속성값 이스케이프 (", \, 줄바꿈) */
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/\n/g, " ").trim();
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

/** 콘텐츠를 MDX <p> 블록으로 렌더 */
function renderParagraphs(content: string): string {
  const escaped = escapeMdx(content);
  return escaped
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((p) => `<p>${p.trim().replace(/\n/g, " ")}</p>`)
    .join("\n");
}

/** 줄바꿈/불릿으로 구분된 항목들을 배열로 파싱 (AskDoctorList용) */
function parseListItems(text: string): string[] {
  const lines = text
    .split(/[\n•▸\-]/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter((s) => s.length > 0);
  return lines;
}

/** URL 추출하여 ReferenceList용 아이템 생성 */
function parseReferences(content: string): Array<{ label: string; href: string }> {
  const urlRegex = /https?:\/\/[^\s<>"\]]+/g;
  const urls = content.match(urlRegex) ?? [];
  return urls.map((href) => ({ label: href, href }));
}

/**
 * report_json을 블로그 MDX 스타일 문자열로 변환
 */
export function reportJsonToMdx(data: ReportJson): string {
  if (!data || typeof data !== "object") return "";

  const title =
    stripAngleBrackets((data.Title as string) ?? (data.title as string) ?? "");
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
  if (sectionKeys.length === 0) {
    const fallback = Object.keys(data).filter(
      (k) => !skipKeys.has(k) && typeof data[k] === "object",
    );
    sectionKeys.push(...fallback);
  }

  const parts: string[] = [];

  parts.push(`import {
  AskDoctorList,
  Callout,
  ReferenceList,
  SummaryBox,
  WarningBox,
} from "~/features/blog/components/blog-components";`);

  parts.push("");
  parts.push(`# ${title || "맞춤 건강 보고서"}`);
  parts.push("");

  if (starting.trim()) {
    parts.push("<SummaryBox>");
    parts.push(renderParagraphs(starting).replace(/^/gm, "  "));
    parts.push("</SummaryBox>");
    parts.push("");
  }

  for (const key of sectionKeys) {
    const section = data[key] as Record<string, unknown> | undefined;
    if (!section || typeof section !== "object") continue;

    const blocks = parseSectionBlocks(section);
    if (blocks.length === 0) continue;

    const firstBlock = blocks[0];
    const isWarnings =
      key.includes("sixth") || String(section.warnings ?? "").length > 0;
    const isAction =
      key.includes("forth") || key.includes("action");
    const isEvidence =
      key.includes("third") ||
      key.includes("blog") ||
      key.includes("paper");
    const isAskDoctor =
      key.includes("fifth") ||
      key.includes("things_to_ask") ||
      key.includes("interaction");

    if (isWarnings) {
      const sectionTitle = stripAngleBrackets(
        firstBlock?.title ?? "주의사항",
      );
      parts.push(`<WarningBox title="${escapeAttr(sectionTitle)}">`);
      for (const b of blocks) {
        if (b.content) {
          parts.push(renderParagraphs(b.content).replace(/^/gm, "  "));
        }
      }
      parts.push("</WarningBox>");
      parts.push("");
      continue;
    }

    if (isAskDoctor) {
      const askItems = blocks.flatMap((b) =>
        b.content ? parseListItems(b.content) : [],
      );
      if (askItems.length > 0) {
        const itemsJson = JSON.stringify(askItems);
        parts.push(`<AskDoctorList items={${itemsJson}} />`);
      } else {
        const sectionTitle = stripAngleBrackets(
          firstBlock?.title ?? "담당 선생님께 여쭤볼 수 있는 질문",
        );
        parts.push(`<Callout title="${escapeAttr(sectionTitle)}">`);
        for (const b of blocks) {
          if (b.content) {
            parts.push(renderParagraphs(b.content).replace(/^/gm, "  "));
          }
        }
        parts.push("</Callout>");
      }
      parts.push("");
      continue;
    }

    const sectionTitle = stripAngleBrackets(firstBlock?.title ?? "섹션");
    parts.push(`## ${escapeMdx(sectionTitle)}`);
    parts.push("");

    if (isEvidence) {
      const refs = blocks.flatMap((b) => (b.content ? parseReferences(b.content) : []));
      if (refs.length > 0) {
        const refsJson = JSON.stringify(refs);
        parts.push(`<ReferenceList items={${refsJson}} />`);
        parts.push("");
      }
    }

    if (isAction) {
      parts.push(`<Callout title="${escapeAttr(sectionTitle)}">`);
      for (const b of blocks) {
        if (b.content) {
          if (blocks.length > 1 && b.title) {
            parts.push(`  <p><strong>${escapeMdx(stripAngleBrackets(b.title))}</strong></p>`);
          }
          parts.push(renderParagraphs(b.content).replace(/^/gm, "  "));
        }
      }
      parts.push("</Callout>");
      parts.push("");
      continue;
    }

    if (isEvidence && blocks.length > 0) {
      parts.push(`<Callout title="${escapeAttr(sectionTitle)}">`);
      for (const b of blocks) {
        if (b.content) {
          if (blocks.length > 1 && b.title) {
            parts.push(`  <p><strong>${escapeMdx(stripAngleBrackets(b.title))}</strong></p>`);
          }
          parts.push(renderParagraphs(b.content).replace(/^/gm, "  "));
        }
      }
      parts.push("</Callout>");
      parts.push("");
      continue;
    }

    for (const b of blocks) {
      if (b.content) {
        if (blocks.length > 1 && b.title) {
          parts.push(`### ${escapeMdx(stripAngleBrackets(b.title))}`);
          parts.push("");
        }
        parts.push(renderParagraphs(b.content));
        parts.push("");
      }
    }
  }

  if (ending.trim()) {
    parts.push('<Callout title="마무리">');
    parts.push(renderParagraphs(ending).replace(/^/gm, "  "));
    parts.push("</Callout>");
  }

  return parts.join("\n").trim();
}
