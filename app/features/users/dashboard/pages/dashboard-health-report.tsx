/**
 * Health Report Page - 내 리포트
 *
 * 건강 리포트 요청 목록 및 최종 리포트 확인/다운로드
 * 데이터 권위: 서버/DB (loader에서 쿼리 함수로 조회)
 */
import type { Route } from "./+types/dashboard-health-report";

import { DateTime } from "luxon";
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Link,
  redirect,
  useFetcher,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from "react-router";

import { HealthReportRequestButton } from "~/core/components/health-report-request-button";
import {
  formatHealthReportInputSummary,
  getHealthReportDetailPath,
  getHealthReportProduct,
  getHealthReportProductPath,
  HEALTH_REPORT_CARDS_PER_PAGE,
  HEALTH_REPORT_PAGE_PATH,
  getReportRequestUserMessage,
  isReportRequestInProgress,
  REPORT_REQUEST_STATUS_CONFIG,
  REPORT_STATUS_PROGRESS,
  REPORT_STATUS_WITH_GREEN_DOT,
  shortRequestId,
} from "~/core/lib/health-report";
import { Button } from "~/core/components/ui/button";
import { Checkbox } from "~/core/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/core/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/core/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/core/components/ui/pagination";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  deleteReportRequest,
  deleteReportRequests,
  getLoggedInUserId,
  getReportRequestsWithHealthReports,
} from "~/features/users/queries";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const meta: Route.MetaFunction = ({ params }) => {
  const product = getHealthReportProduct(params.productId ?? "");
  return [
    {
      title: product ? `${product.name} | Dashboard` : "내 리포트 | Dashboard",
    },
  ];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const productId = params.productId;
  if (!productId) {
    throw redirect(HEALTH_REPORT_PAGE_PATH);
  }

  // 이전 URL 형식 호환: /health/report/:requestId → /health/report/basic/:requestId
  if (UUID_REGEX.test(productId)) {
    throw redirect(
      `${getHealthReportProductPath("basic")}/${productId}`,
    );
  }

  const product = getHealthReportProduct(productId);
  if (!product) {
    throw redirect(HEALTH_REPORT_PAGE_PATH);
  }

  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  if (!userId) {
    throw new Response(null, { status: 401 });
  }

  const requests = await getReportRequestsWithHealthReports(client, {
    userId,
  });

  return { requests, product };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const formData = await request.formData();
  const actionType = formData.get("action");

  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  if (!userId) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (actionType === "delete") {
    const requestId = formData.get("requestId") as string | null;
    if (!requestId) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    try {
      await deleteReportRequest(client, { userId, requestId });
      return Response.json({ success: true });
    } catch (e) {
      console.error("deleteReportRequest error:", e);
      return Response.json(
        { error: "삭제에 실패했습니다." },
        { status: 500 },
      );
    }
  }

  if (actionType === "deleteBulk") {
    const requestIds = formData.getAll("requestIds") as string[];
    const filtered = requestIds.filter((id) => typeof id === "string" && id);
    if (filtered.length === 0) {
      return Response.json({ error: "선택된 항목이 없습니다." }, { status: 400 });
    }
    try {
      await deleteReportRequests(client, { userId, requestIds: filtered });
      return Response.json({ success: true });
    } catch (e) {
      console.error("deleteReportRequests error:", e);
      return Response.json(
        { error: "삭제에 실패했습니다." },
        { status: 500 },
      );
    }
  }

  return Response.json({ error: "Invalid request" }, { status: 400 });
}

export default function DashboardHealthReportPage({
  loaderData,
}: Route.ComponentProps) {
  const { requests, product } = loaderData;
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const deleteBulkFetcher = useFetcher<typeof action>();

  const totalPages = Math.ceil(
    requests.length / HEALTH_REPORT_CARDS_PER_PAGE,
  ) || 1;
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * HEALTH_REPORT_CARDS_PER_PAGE;
  const paginatedRequests = requests.slice(
    start,
    start + HEALTH_REPORT_CARDS_PER_PAGE,
  );

  const pageIds = new Set(paginatedRequests.map((r) => r.id));
  const allPageSelected =
    paginatedRequests.length > 0 &&
    paginatedRequests.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allPageSelected, pageIds]);

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDeleteBulk = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개 리포트를 삭제하시겠습니까?`)) return;
    const formData = new FormData();
    formData.set("action", "deleteBulk");
    selectedIds.forEach((id) => formData.append("requestIds", id));
    deleteBulkFetcher.submit(formData, { method: "post" });
  };

  useEffect(() => {
    if (
      deleteBulkFetcher.state === "idle" &&
      deleteBulkFetcher.data &&
      "success" in deleteBulkFetcher.data
    ) {
      setSelectedIds(new Set());
      revalidator.revalidate();
    }
  }, [deleteBulkFetcher.state, deleteBulkFetcher.data, revalidator]);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    return `${getHealthReportProductPath(product.id)}?${params.toString()}`;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to={HEALTH_REPORT_PAGE_PATH}
            viewTransition
            className="text-muted-foreground hover:text-foreground mb-2 inline-block text-sm"
          >
            ← 상품 목록으로
          </Link>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {product.description}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            건강 리포트 요청 및 진행상태 확인 ·{" "}
            <span className="font-semibold text-foreground">
              {product.price.toLocaleString()}원
            </span>
          </p>
        </div>
        <HealthReportRequestButton
          productId={product.id}
          sourceTag="report_page"
          onSuccess={() => revalidator.revalidate()}
        />
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="text-muted-foreground mb-4 size-12" />
              <p className="text-muted-foreground mb-2 text-center">
                아직 요청한 건강 리포트가 없습니다.
              </p>
              <p className="text-muted-foreground mb-4 text-center text-sm">
                버튼을 클릭하여 맞춤 건강 리포트를 요청하세요.
              </p>
              <HealthReportRequestButton
                productId={product.id}
                sourceTag="report_page_empty"
                onSuccess={() => revalidator.revalidate()}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 전체/선택 삭제 툴바 */}
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all"
                  checked={allPageSelected}
                  onCheckedChange={toggleAll}
                  aria-label="현재 페이지 전체 선택"
                />
                <label
                  htmlFor="select-all"
                  className="text-muted-foreground cursor-pointer text-sm"
                >
                  전체 선택
                </label>
                {someSelected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleDeleteBulk}
                    disabled={deleteBulkFetcher.state === "submitting"}
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    선택 삭제 ({selectedIds.size})
                  </Button>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                {start + 1}–
                {Math.min(start + HEALTH_REPORT_CARDS_PER_PAGE, requests.length)}{" "}
                / {requests.length}
              </span>
            </div>

            <div className="space-y-3">
              {paginatedRequests.map((req) => (
                <ReportRequestCard
                  key={req.id}
                  productId={product.id}
                  request={{
                    id: req.id,
                    status: req.status,
                    created_at: req.created_at,
                    input_json: (req.input_json ?? null) as
                      | Record<string, unknown>
                      | null,
                    healthReport: req.healthReport
                      ? {
                          id: req.healthReport.id,
                          report_json: req.healthReport.report_json,
                          report_html: req.healthReport.report_html,
                          pdf_url: req.healthReport.pdf_url,
                          created_at: req.healthReport.created_at,
                        }
                      : null,
                  }}
                  selected={selectedIds.has(req.id)}
                  onToggleSelect={() => toggleId(req.id)}
                  onDeleted={() => revalidator.revalidate()}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      to={buildPageUrl(currentPage - 1)}
                      aria-disabled={currentPage <= 1}
                      onClick={(e) => {
                        if (currentPage <= 1) e.preventDefault();
                        else setSearchParams({ page: String(currentPage - 1) });
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1,
                    )
                    .map((p, idx, arr) => (
                      <PaginationItem key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1">…</span>
                        )}
                        <PaginationLink
                          to={buildPageUrl(p)}
                          isActive={p === currentPage}
                          onClick={() => setSearchParams({ page: String(p) })}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      to={buildPageUrl(currentPage + 1)}
                      aria-disabled={currentPage >= totalPages}
                      onClick={(e) => {
                        if (currentPage >= totalPages) e.preventDefault();
                        else setSearchParams({ page: String(currentPage + 1) });
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReportRequestCard({
  productId,
  request,
  selected,
  onToggleSelect,
  onDeleted,
}: {
  productId: string;
  request: {
    id: string;
    status: string;
    created_at: string;
    current_step?: string | null;
    input_json?: unknown;
    healthReport?: {
      id: string;
      report_json?: unknown;
      report_html: string | null;
      pdf_url: string | null;
      created_at: string;
    } | null;
  };
  selected: boolean;
  onToggleSelect: () => void;
  onDeleted?: () => void;
}) {
  const deleteFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const DeleteForm = deleteFetcher.Form;

  useEffect(() => {
    if (
      deleteFetcher.state === "idle" &&
      deleteFetcher.data &&
      "success" in deleteFetcher.data
    ) {
      onDeleted?.();
      revalidator.revalidate();
    }
  }, [deleteFetcher.state, deleteFetcher.data, onDeleted, revalidator]);

  const statusConfig = REPORT_REQUEST_STATUS_CONFIG[request.status] ?? {
    label: request.status,
    description: "",
    order: 0,
  };
  const userMsg = getReportRequestUserMessage(
    request.status,
    request.current_step,
  );
  const showProgressSpinner = isReportRequestInProgress(
    request.status,
    request.current_step,
  );
  const isFailed = request.status === "failed";
  const hasReport =
    !!request.healthReport &&
    request.healthReport.report_json &&
    typeof request.healthReport.report_json === "object" &&
    request.healthReport.report_json !== null &&
    Object.keys(request.healthReport.report_json).length > 0;

  const inputSummary = formatHealthReportInputSummary(
    request.input_json as Record<string, unknown> | null | undefined,
  );
  const currentStepIndex = REPORT_STATUS_PROGRESS.indexOf(request.status);
  const showGreenDot = REPORT_STATUS_WITH_GREEN_DOT.has(request.status);

  const detailPath = getHealthReportDetailPath(productId, request.id);

  const navigate = useNavigate();

  return (
    <Card
      className={`group relative transition-colors ${
        isFailed ? "border-destructive/50" : ""
      } ${hasReport ? "cursor-pointer hover:border-primary/50" : ""}`}
      onClick={
        hasReport
          ? (e) => {
              if (
                !(e.target as HTMLElement).closest(
                  "button, form, [role='checkbox']",
                )
              ) {
                navigate(detailPath);
              }
            }
          : undefined
      }
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-3">
        <div
          className="flex shrink-0 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label={`#${shortRequestId(request.id)} 선택`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                isFailed
                  ? "bg-destructive/15 text-destructive"
                  : showGreenDot
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {showGreenDot && (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
                  aria-hidden
                />
              )}
              {statusConfig.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              #{shortRequestId(request.id)}
            </span>
          </div>
          <CardDescription className="mt-0.5">
            {DateTime.fromISO(request.created_at, {
              zone: "Asia/Seoul",
            }).toFormat("yyyy.MM.dd HH:mm")}
          </CardDescription>
        </div>
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {showProgressSpinner && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {isFailed && <AlertCircle className="size-4 text-destructive" />}
          <DeleteForm method="post">
            <input type="hidden" name="action" value="delete" />
            <input type="hidden" name="requestId" value={request.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8"
              title="삭제"
              disabled={deleteFetcher.state === "submitting"}
              onClick={(e) => {
                if (!confirm("정말 이 리포트를 삭제하시겠습니까?")) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </DeleteForm>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3 pt-0">
        {/* 진행 단계 (한 줄) */}
        {!isFailed && (
          <div className="flex flex-wrap gap-1">
            {REPORT_STATUS_PROGRESS.map((step, idx) => {
              const cfg = REPORT_REQUEST_STATUS_CONFIG[step];
              const isDone = currentStepIndex > idx;
              const isCurrent = request.status === step;
              return (
                <span
                  key={step}
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] ${
                    isCurrent
                      ? "bg-primary/15 text-primary"
                      : isDone
                        ? "bg-muted/80 text-muted-foreground"
                        : "bg-muted/50 text-muted-foreground/70"
                  }`}
                  title={(cfg?.description ?? "") as string}
                >
                  {(cfg?.label ?? step) as string}
                </span>
              );
            })}
          </div>
        )}

        {/* 요청 내용 (접기) */}
        {inputSummary.length > 0 && (
          <Collapsible defaultOpen={false} className="group/collapse">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-1 rounded py-1 text-left text-xs text-muted-foreground hover:bg-muted/30"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronRight className="size-3.5 shrink-0 transition-transform group-data-[state=open]/collapse:rotate-90" />
                요청 내용
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-0.5 border-t border-dashed pt-2 text-xs">
                {inputSummary.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* status + current_step 기준 단일 안내 문구 */}
        {isFailed ? (
          <p className="text-destructive text-xs">{userMsg.primary}</p>
        ) : (
          <p className="text-muted-foreground text-xs">{userMsg.primary}</p>
        )}
      </CardContent>
    </Card>
  );
}
