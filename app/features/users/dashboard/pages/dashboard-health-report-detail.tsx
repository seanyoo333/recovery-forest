/**
 * Health Report Detail Page - 맞춤 건강 보고서 상세
 *
 * report_components 기반 프리미엄 렌더링 (ReportCover, ReportHeroSummary, SectionCard 등)
 */
import type { Route } from "./+types/dashboard-health-report-detail";

import { ArrowLeft, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { DateTime } from "luxon";
import { bundleMDX } from "mdx-bundler";
import path from "node:path";
import { useEffect } from "react";
import { Link, data, useFetcher, useRevalidator } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent } from "~/core/components/ui/card";
import {
  HEALTH_REPORT_PDF_FAILED_MESSAGE,
  REPORT_HTML_GENERATION_STATUSES,
  getHealthReportProductPath,
} from "~/core/lib/health-report";
import makeServerClient from "~/core/lib/supa-client.server";
import { HealthReportContent } from "~/features/users/dashboard/components/health-report-renderers";
import {
  getReportContentAvailability,
  type ReportJson,
  isHealthReportStructure,
} from "~/features/users/dashboard/report-detail-utils";
import {
  REPORT_HTML_VERSION_MARKER,
  reportJsonToHtml,
} from "~/features/users/health/report-json-to-html";
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

function hasLatestFixedSectionTitles(reportHtml: string | null | undefined): boolean {
  if (!reportHtml || !reportHtml.trim()) return false;
  const hasLatestVersionMarker = reportHtml.includes(REPORT_HTML_VERSION_MARKER);
  if (!hasLatestVersionMarker) return false;
  return (
    reportHtml.includes("현재 상태 한눈에 보기") &&
    reportHtml.includes("관련 바이오 표적 및 핵심 영역") &&
    reportHtml.includes("현재 상황 해석 근거와 의미") &&
    reportHtml.includes("실행 가이드") &&
    reportHtml.includes("통합의학 상담 시 질문 내용") &&
    reportHtml.includes("주의사항") &&
    reportHtml.includes("근거자료")
  );
}

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
    (!report.report_html ||
      String(report.report_html).trim() === "" ||
      !hasLatestFixedSectionTitles(report.report_html));

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
    } catch {
      // HTML 변환/저장 실패 시 MDX 경로로 폴백
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
    } catch {
      // MDX 번들 실패 시 폴백
    }
  }

  return { ...result, report, mdxCode, productId };
}

export default function DashboardHealthReportDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { report, request, mdxCode, productId } = loaderData;
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const requestId = request?.id ?? "";
  const createdAt = report.created_at;
  const createdAtKoreanDateTime = DateTime.fromISO(createdAt, {
    zone: "Asia/Seoul",
  }).toFormat("yyyy년 M월 d일 HH:mm");
  const createdAtKoreanDate = DateTime.fromISO(createdAt, {
    zone: "Asia/Seoul",
  }).toFormat("yyyy년 M월 d일");

  const reportJson = (report.report_json ?? null) as ReportJson | null;
  const reportHtml = report.report_html;
  const reportContentAvailability = getReportContentAvailability({
    reportJson,
    reportHtml,
    mdxCode,
  });
  const hasRawReportJson =
    !!reportJson &&
    typeof reportJson === "object" &&
    Object.keys(reportJson).length > 0;
  const noContentReasons: string[] = [];
  if (!reportContentAvailability.hasSavedHtml) {
    noContentReasons.push("저장된 HTML 본문이 아직 생성되지 않았습니다.");
  }
  if (!reportContentAvailability.hasMdxCode) {
    noContentReasons.push("MDX 변환 결과가 없어 프리미엄 본문 렌더링을 시도하지 못했습니다.");
  }
  if (!hasRawReportJson) {
    noContentReasons.push("report_json 데이터가 비어 있어 본문 생성 기준을 충족하지 못했습니다.");
  } else if (!reportContentAvailability.hasPremiumReportData) {
    noContentReasons.push(
      "report_json이 현재 보고서 구조 규칙과 맞지 않아 본문으로 해석되지 않았습니다.",
    );
  }

  /** PDF 다운로드 가능: (기존 pdf_url) 또는 (private 버킷의 pdf_path + pdf_status=pdf_ready) */
  const canDownloadPdf =
    (typeof report.pdf_url === "string" && report.pdf_url.trim()) ||
    (typeof report.pdf_path === "string" &&
      report.pdf_path.trim() &&
      report.pdf_status === "pdf_ready");

  /** PDF 다운로드 URL: public이면 pdf_url, private이면 signed URL API */
  const pdfDownloadHref = report.pdf_url
    ? report.pdf_url
    : report.pdf_path && report.pdf_status === "pdf_ready"
      ? `/api/health-report-pdf-download?request_id=${encodeURIComponent(requestId)}`
      : null;

  const canRequestPdf =
    !canDownloadPdf &&
    reportContentAvailability.hasRenderableContent &&
    requestId;

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
                {createdAtKoreanDateTime}
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
        {reportContentAvailability.hasRenderableContent ? (
          <HealthReportContent
            availability={reportContentAvailability}
            reportJson={reportJson}
            reportHtml={reportHtml}
            mdxCode={mdxCode}
            createdAtKoreanDate={createdAtKoreanDate}
          />
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
              <div className="mt-5 max-w-2xl rounded-lg border border-amber-200/70 bg-amber-50/60 p-4 text-left dark:border-amber-900/50 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  현재 요청 상태: {request.status}
                </p>
                {request.current_step ? (
                  <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/80">
                    current_step: {request.current_step}
                  </p>
                ) : null}
                {noContentReasons.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-200">
                    {noContentReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
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
