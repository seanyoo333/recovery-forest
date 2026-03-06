/**
 * Health Report Page - 내 리포트
 *
 * 건강 리포트 요청 목록 및 최종 리포트 확인/다운로드
 * 데이터 권위: 서버/DB (loader에서 쿼리 함수로 조회)
 */
import type { Route } from "./+types/dashboard-health-report";

import { DateTime } from "luxon";
import { FileText, Loader2 } from "lucide-react";
import { Link, useRevalidator } from "react-router";

import { HealthReportRequestButton } from "~/core/components/health-report-request-button";
import { HEALTH_REPORT_PENDING_MESSAGE } from "~/core/lib/health-report";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  getLoggedInUserId,
  getReportRequestsWithHealthReports,
} from "~/features/users/queries";

const STATUS_LABELS: Record<string, string> = {
  requested: "요청됨",
  draft_ready: "초안 준비됨",
  under_review: "검수 중",
  completed: "완료",
};

export const meta: Route.MetaFunction = () => {
  return [{ title: "내 리포트 | Dashboard" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  const requests = await getReportRequestsWithHealthReports(client, {
    userId,
  });

  return { requests };
}

export default function DashboardHealthReportPage({
  loaderData,
}: Route.ComponentProps) {
  const { requests } = loaderData;
  const revalidator = useRevalidator();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">개인 맞춤 건강 보고서</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            건강 리포트 요청 및 진행상태 확인
          </p>
        </div>
        <HealthReportRequestButton
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
                sourceTag="report_page_empty"
                onSuccess={() => revalidator.revalidate()}
              />
            </CardContent>
          </Card>
        ) : (
          requests.map((req) => (
            <ReportRequestCard key={req.id} request={req} />
          ))
        )}
      </div>
    </div>
  );
}

function ReportRequestCard({
  request,
}: {
  request: {
    id: string;
    status: string;
    created_at: string;
    healthReport?: {
      id: string;
      report_html: string | null;
      pdf_url: string | null;
      created_at: string;
    } | null;
  };
}) {
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const isPending =
    request.status === "requested" ||
    request.status === "draft_ready" ||
    request.status === "under_review";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            {statusLabel}
          </CardTitle>
          <CardDescription>
            요청일:{" "}
            {DateTime.fromISO(request.created_at, {
              zone: "Asia/Seoul",
            }).toFormat("yyyy.MM.dd HH:mm")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {request.healthReport && (
          <div className="space-y-3">
            {request.healthReport.report_html && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/30 p-4"
                dangerouslySetInnerHTML={{
                  __html: request.healthReport.report_html,
                }}
              />
            )}
            {request.healthReport.pdf_url && (
              <Button asChild variant="outline">
                <a
                  href={request.healthReport.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PDF 다운로드
                </a>
              </Button>
            )}
          </div>
        )}
        {!request.healthReport && isPending && (
          <p className="text-muted-foreground text-sm">
            {HEALTH_REPORT_PENDING_MESSAGE}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
