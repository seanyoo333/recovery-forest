/**
 * Health Report Detail Page - 맞춤 건강 보고서 상세
 *
 * report_components 기반 프리미엄 렌더링 (ReportCover, ReportHeroSummary, SectionCard 등)
 */
import type { Route } from "./+types/dashboard-health-report-detail";

import { ArrowLeft, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { DateTime } from "luxon";
import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import path from "node:path";
import { useEffect } from "react";
import { Link, data, useFetcher, useRevalidator } from "react-router";

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
  ReportHeroSummary,
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
  HEALTH_REPORT_PDF_FAILED_MESSAGE,
  REPORT_HTML_GENERATION_STATUSES,
  getHealthReportProductPath,
} from "~/core/lib/health-report";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  AskDoctorList,
  Callout,
  ReferenceList,
  SummaryBox,
  WarningBox,
} from "~/features/blog/components/blog-components";
import { reportJsonToHtml } from "~/features/users/health/report-json-to-html";
import { reportJsonToMdx } from "~/features/users/health/report-json-to-mdx";
import {
  getHealthReportByRequestId,
  getLoggedInUserId,
  upsertReportHtml,
} from "~/features/users/queries";

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.report) {
    return [{ title: "리포트를 찾을 수 없음 | Evidence Base" }];
  }
  return [
    {
      title: `맞춤 건강 보고서 | Evidence Base`,
    },
  ];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const productId = params.productId;
  const requestId = params.requestId;

  if (!productId || !requestId) {
    throw data(null, { status: 404 });
  }

  const result = await getHealthReportByRequestId(client, {
    userId,
    requestId,
  });

  if (!result) {
    throw data(null, { status: 404 });
  }

  let { report } = result;
  const reportJson = report.report_json as ReportJson | null;
  const hasReportJson =
    reportJson &&
    typeof reportJson === "object" &&
    Object.keys(reportJson).length > 0;
  const statusAllowsHtml = REPORT_HTML_GENERATION_STATUSES.includes(
    result.request.status,
  );
  const needsHtml =
    statusAllowsHtml &&
    hasReportJson &&
    (!report.report_html || String(report.report_html).trim() === "");

  if (needsHtml && reportJson) {
    try {
      const html = reportJsonToHtml(reportJson, {
        createdAt: report.created_at
          ? new Date(report.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : undefined,
      });
      if (html) {
        await upsertReportHtml(client, {
          requestId,
          userId,
          reportHtml: html,
        });
        report = { ...report, report_html: html };
      }
    } catch (err) {
      console.warn("Health report JSON→HTML conversion/upsert failed:", err);
    }
  }

  let mdxCode: string | null = null;

  if (reportJson && isHealthReportStructure(reportJson)) {
    try {
      const mdxSource = reportJsonToMdx(reportJson);
      if (mdxSource.trim()) {
        const { code } = await bundleMDX({
          source: mdxSource,
          cwd: process.cwd(),
          esbuildOptions(options) {
            options.resolveExtensions = [
              ".webp",
              ".png",
              ".jpg",
              ".jpeg",
              ".svg",
              ".gif",
              ".tsx",
              ".ts",
              ".jsx",
              ".js",
              ".mjs",
              ".cjs",
            ];
            options.alias = { "~": path.join(process.cwd(), "app") };
            return options;
          },
        });
        mdxCode = code;
      }
    } catch (err) {
      console.warn(
        "Health report MDX compilation failed, using fallback:",
        err,
      );
    }
  }

  return { ...result, report, mdxCode, productId };
}

type ReportJson = Record<string, unknown>;

function isHealthReportStructure(data: ReportJson): boolean {
  if (!data || typeof data !== "object") return false;
  const hasTitle =
    typeof data.Title === "string" || typeof data.title === "string";
  const hasContext = Array.isArray(data.context);
  const hasSection = Object.keys(data).some(
    (k) => k.includes("section") && typeof data[k] === "object",
  );
  return hasTitle || hasContext || hasSection;
}

/** 섹션 객체에서 title-content 블록 추출 (insertion order 기준, _content/_explanation 직전 키를 제목으로 사용) */
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
      blocks.push({ title, content: val });
      pendingTitle = null;
    } else {
      pendingTitle = val;
    }
  }
  return blocks.filter((b) => b.content.length > 0);
}

/** HTML 태그 제거 (예: <...> 형태) */
function stripAngleBrackets(s: string): string {
  return s.replace(/^<([^>]*)>$/i, "$1").trim() || s;
}

/** 줄바꿈/불릿으로 구분된 항목 파싱 */
function parseListItems(text: string): string[] {
  return text
    .split(/[\n•▸\-]/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter((s) => s.length > 0);
}

/** report_components 기반 유료 프리미엄 보고서 렌더러 */
function PremiumReportRenderer({
  data,
  createdAt,
}: {
  data: ReportJson | null | undefined;
  createdAt: string;
}) {
  if (!data || typeof data !== "object") return null;

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
  const sectionKeySet = sectionKeys.length
    ? new Set(sectionKeys)
    : new Set(
        Object.keys(data).filter(
          (k) => !skipKeys.has(k) && typeof data[k] === "object",
        ),
      );

  const first = data.first_section as Record<string, unknown> | undefined;
  const second = data.second_section as Record<string, unknown> | undefined;
  const third = data.third_section as Record<string, unknown> | undefined;
  const forth = data.forth_section as Record<string, unknown> | undefined;
  const fifth = data.fifth_section as Record<string, unknown> | undefined;
  const sixth = data.sixth_section as Record<string, unknown> | undefined;

  const firstBlocks = first ? parseSectionBlocks(first) : [];
  const totalSummary = (first?.total_individualized_summary as string) ?? "";
  const totalSummaryContent =
    (first?.total_individualized_summary_content as string) ?? "";
  const keyPoints = firstBlocks
    .filter(
      (b) =>
        b.title &&
        ![
          "total_individualized_summary",
          "total individualized summary",
        ].includes(b.title.toLowerCase()),
    )
    .slice(0, 5)
    .map((b) => b.title);

  return (
    <article className="max-w-4xl space-y-10">
      <ReportCover
        title={title}
        subtitle={starting.trim() || undefined}
        reportType="개인 맞춤 건강 전략 리포트"
        createdAt={createdAt}
        brandName="Evidence Base"
      />

      {(totalSummary || totalSummaryContent || starting.trim()) && (
        <ReportHeroSummary
          headline={stripAngleBrackets(totalSummary) || title}
          summary={
            totalSummaryContent || starting || "맞춤 분석 결과를 확인해 주세요."
          }
          keyPoints={keyPoints}
          tone="focus"
        />
      )}

      {firstBlocks.length > 0 && (
        <SectionCard
          step="1"
          title="현재 상태 한눈에 보기"
          description="혈액·생활습관·전체 요약을 종합한 개인화 해석입니다."
        >
          <div className="space-y-4">
            {firstBlocks
              .filter(
                (b) =>
                  ![
                    "total_individualized_summary",
                    "total individualized summary",
                  ].includes((b.title || "").toLowerCase()),
              )
              .map((b, i) => (
                <InsightPanel
                  key={i}
                  title={stripAngleBrackets(b.title)}
                  content={b.content}
                  variant={
                    b.title?.toLowerCase().includes("routine")
                      ? "routine"
                      : b.title?.toLowerCase().includes("blood")
                        ? "clinical"
                        : "default"
                  }
                />
              ))}
          </div>
        </SectionCard>
      )}

      {sectionKeySet.has("second_section") && second && (
        <SectionCard
          step="2"
          title="핵심 표적 및 관리 축"
          description="우선적으로 살펴볼 바이오마커와 생활습관 포인트입니다."
        >
          <PriorityTargetCard
            axis={stripAngleBrackets(
              (second.major_targets_axis as string) ?? "종합",
            )}
            explanation={(second.targets_axis_explanation as string) ?? ""}
            symptoms={[]}
            targets={[]}
          />
        </SectionCard>
      )}

      {sectionKeySet.has("third_section") && third && (
        <SectionCard
          step="3"
          title="근거 및 연구 요약"
          description="표적과 생활습관 연결 근거, 관련 논문·리소스 요약입니다."
        >
          {third.relation_between_targets_status != null ||
          third.top_paper_research != null ? (
            <EvidenceBridge
              relationTitle={stripAngleBrackets(
                (third.relation_between_targets_status as string) ??
                  "표적-상태 연결",
              )}
              relationContent={(third.relation_content as string) ?? ""}
              paperSummaryTitle={stripAngleBrackets(
                (third.top_paper_research as string) ?? "관련 연구",
              )}
              paperSummary={(third.top_paper_research_content as string) ?? ""}
              relevanceTitle="맞춤 해석"
              relevanceContent={
                (third.relation_content as string) ??
                (third.top_paper_research_content as string) ??
                ""
              }
              extraEvidenceTitle={
                third.top_blog ? String(third.top_blog) : undefined
              }
              extraEvidenceContent={
                (third.top_blog_content as string) ??
                (third.top_blog
                  ? ((third as Record<string, unknown>)[
                      `top_blog_content`
                    ] as string)
                  : undefined)
              }
            />
          ) : (
            <div className="space-y-4">
              {parseSectionBlocks(third).map((b, i) => (
                <InsightPanel
                  key={i}
                  title={stripAngleBrackets(b.title)}
                  content={b.content}
                  variant="default"
                />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {sectionKeySet.has("forth_section") && forth && (
        <SectionCard
          step="4"
          title="실행 가이드"
          description="목표와 7일·8주 단위 실행 계획입니다."
        >
          <ActionTimeline
            goalTitle={stripAngleBrackets(
              (forth.goal_action as string) ?? "목표",
            )}
            goalContent={(forth.goal_action_content as string) ?? ""}
            firstWeekTitle={stripAngleBrackets(
              (forth.goal_7d_action as string) ?? "7일 실행",
            )}
            firstWeekContent={(forth.goal_7d_action_content as string) ?? ""}
            eightWeekTitle={stripAngleBrackets(
              (forth.goal_8w_action as string) ?? "8주 실행",
            )}
            eightWeekContent={(forth.goal_8w_action_content as string) ?? ""}
          />
        </SectionCard>
      )}

      {sectionKeySet.has("fifth_section") &&
        fifth &&
        (() => {
          const questions = [
            ...(fifth.current_interaction_content
              ? parseListItems(String(fifth.current_interaction_content))
              : []),
            ...(fifth.suggested_interaction_content
              ? parseListItems(String(fifth.suggested_interaction_content))
              : []),
            ...parseSectionBlocks(fifth).flatMap((b) =>
              parseListItems(b.content),
            ),
          ].filter((q) => q.length > 0);
          return questions.length > 0 ? (
            <DoctorQuestionBox
              title="담당 선생님께 여쭤볼 수 있는 질문"
              intro={(fifth.things_to_ask as string) ?? undefined}
              questions={questions}
            />
          ) : (
            <SectionCard
              step="5"
              title="상담 시 참고"
              description="담당 선생님과 상의할 때 참고하실 수 있는 내용입니다."
            >
              <div className="space-y-4">
                {parseSectionBlocks(fifth).map((b, i) => (
                  <InsightPanel
                    key={i}
                    title={stripAngleBrackets(b.title)}
                    content={b.content}
                    variant="default"
                  />
                ))}
              </div>
            </SectionCard>
          );
        })()}

      {sectionKeySet.has("sixth_section") && sixth && (
        <WarningPanel
          title={stripAngleBrackets((sixth.warnings as string) ?? "주의사항")}
          items={parseListItems((sixth.warnings_content as string) ?? "")}
        />
      )}

      {ending.trim() && (
        <ReportClosing
          message={ending}
          nextStepTitle="다음 권장 단계"
          nextStepItems={[]}
        />
      )}

      <ReportFooterMeta
        createdAt={createdAt}
        medicalDisclaimer="본 리포트는 참고용 건강정보이며, 의료행위·진단·처방을 대체하지 않습니다."
        aiNotice="이 리포트에는 AI를 활용한 자동화된 분석 결과가 포함될 수 있습니다."
      />
    </article>
  );
}

/** 기존 범용 구조 대응 (html, sections, body 등) */
function FallbackReportRenderer({
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
function HealthReportMDXContent({ code }: { code: string }) {
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

export default function DashboardHealthReportDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { report, request, mdxCode, productId } = loaderData;
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const requestId = request?.id ?? "";

  const reportJson = (report.report_json ?? null) as ReportJson | null;
  const reportHtml = report.report_html;
  const pdfUrl = report.pdf_url;
  const pdfPath = report.pdf_path;
  const pdfStatus = report.pdf_status;
  const createdAt = report.created_at;

  const useMdx = !!mdxCode;
  const usePremium = reportJson && isHealthReportStructure(reportJson);
  const hasHtmlContent = typeof reportHtml === "string" && reportHtml.trim();
  const hasAnyContent = useMdx || usePremium || hasHtmlContent;

  /** PDF 다운로드 가능: (기존 pdf_url) 또는 (private 버킷의 pdf_path + pdf_status=pdf_ready) */
  const canDownloadPdf =
    (typeof pdfUrl === "string" && pdfUrl.trim()) ||
    (typeof pdfPath === "string" &&
      pdfPath.trim() &&
      pdfStatus === "pdf_ready");

  /** PDF 다운로드 URL: public이면 pdf_url, private이면 signed URL API */
  const pdfDownloadHref = pdfUrl
    ? pdfUrl
    : pdfPath && pdfStatus === "pdf_ready"
      ? `/api/health-report-pdf-download?request_id=${encodeURIComponent(requestId)}`
      : null;

  const canRequestPdf = !canDownloadPdf && hasAnyContent && requestId;

  /** PDF 저장 요청 성공 시 → 재조회 후 다운로드 링크 표시 */
  const pdfSuccess =
    fetcher.state === "idle" &&
    fetcher.data &&
    typeof fetcher.data === "object" &&
    (fetcher.data as { success?: boolean }).success;

  useEffect(() => {
    if (pdfSuccess) {
      revalidator.revalidate();
    }
  }, [pdfSuccess, revalidator]);

  const isPdfLoading =
    fetcher.state !== "idle" && fetcher.formAction === "/api/health-report-pdf";
  const pdfError =
    fetcher.data &&
    typeof fetcher.data === "object" &&
    !(fetcher.data as { success?: boolean }).success
      ? ((fetcher.data as { error?: string }).error ??
        HEALTH_REPORT_PDF_FAILED_MESSAGE)
      : null;

  return (
    <div className="to-background dark:to-background flex min-h-screen flex-col bg-gradient-to-b from-slate-50/50 dark:from-slate-950/30">
      {/* 헤더 - 프리미엄 */}
      <header className="sticky top-0 z-10 border-b bg-white/90 shadow-sm backdrop-blur dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={getHealthReportProductPath(productId)}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
                <Sparkles className="size-6 text-amber-500" />
                맞춤 건강 보고서
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {DateTime.fromISO(createdAt, { zone: "Asia/Seoul" }).toFormat(
                  "yyyy년 M월 d일 HH:mm",
                )}
              </p>
            </div>
          </div>
          {canDownloadPdf && pdfDownloadHref ? (
            <Button asChild className="gap-2 shadow-md">
              <a
                href={pdfDownloadHref}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="size-4" />
                PDF 다운로드
              </a>
            </Button>
          ) : canRequestPdf ? (
            <fetcher.Form method="post" action="/api/health-report-pdf">
              <input type="hidden" name="request_id" value={requestId} />
              <Button
                type="submit"
                className="gap-2 shadow-md"
                disabled={isPdfLoading}
              >
                {isPdfLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                PDF 저장하기
              </Button>
            </fetcher.Form>
          ) : null}
        </div>
      </header>

      {/* 배지 */}
      <div className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pt-6 md:px-8">
        <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          참고용 건강정보
        </span>
        <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          AI 생성 결과 포함
        </span>
        <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          의료행위 아님
        </span>
      </div>

      {/* 본문 */}
      <main className="mx-auto max-w-5xl flex-1 px-4 py-8 md:px-8">
        {hasAnyContent ? (
          usePremium ? (
            <PremiumReportRenderer
              data={reportJson}
              createdAt={DateTime.fromISO(createdAt, {
                zone: "Asia/Seoul",
              }).toFormat("yyyy년 M월 d일")}
            />
          ) : useMdx ? (
            <article className="max-w-4xl [&_blockquote+p]:-mt-0 [&_h2+ol]:-mt-2 [&_h2+ul]:-mt-2 [&_h3+ol]:-mt-2 [&_h3+ul]:-mt-2 [&_h4+ol]:-mt-2 [&_h4+ul]:-mt-2 [&_li_ol]:my-0 [&_li_ol]:-mt-2 [&_li_ul]:my-0 [&_li_ul]:-mt-2 [&_p+blockquote]:-mt-0 [&_p+ol]:-mt-2 [&_p+ul]:-mt-2">
              {mdxCode && <HealthReportMDXContent code={mdxCode} />}
            </article>
          ) : hasHtmlContent ? (
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-6 md:p-8">
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: reportHtml! }}
                />
              </CardContent>
            </Card>
          ) : (
            <FallbackReportRenderer data={reportJson} />
          )
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="text-muted-foreground mb-4 size-14" />
              <p className="text-muted-foreground">
                아직 리포트 내용이 준비되지 않았습니다.
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                잠시 후 다시 확인해 주세요.
              </p>
            </CardContent>
          </Card>
        )}

        {(canDownloadPdf || canRequestPdf) && (
          <div className="mt-10 flex flex-col items-center gap-3">
            {canDownloadPdf && pdfDownloadHref ? (
              <Button asChild variant="outline" size="lg" className="gap-2">
                <a
                  href={pdfDownloadHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Download className="size-4" />
                  PDF 다운로드
                </a>
              </Button>
            ) : (
              <fetcher.Form method="post" action="/api/health-report-pdf">
                <input type="hidden" name="request_id" value={requestId} />
                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  disabled={isPdfLoading}
                >
                  {isPdfLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  PDF 저장하기
                </Button>
              </fetcher.Form>
            )}
            {pdfError && <p className="text-destructive text-sm">{pdfError}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
