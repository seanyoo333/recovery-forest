/**
 * Health Report PDF 다운로드 API
 *
 * GET ?request_id=xxx → 본인 소유 확인 → Supabase Storage에서 파일 직접 다운로드 → PDF 스트리밍
 * Private 버킷이므로 서버에서 download()로 가져와 클라이언트에 전달 (리다이렉트 대신)
 */
import type { Route } from "./+types/health-report-pdf-download";

import { redirect } from "react-router";

import { makeAdminClient } from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { getHealthReportByRequestId, getLoggedInUserId } from "~/features/users/queries";

/** Supabase Storage 버킷 - n8n이 업로드하는 버킷명 (health_report 또는 health-reports) */
const PDF_STORAGE_BUCKETS = ["health_report"];

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    throw redirect("/login");
  }

  const url = new URL(request.url);
  const requestId = url.searchParams.get("request_id")?.trim();

  if (!requestId) {
    return new Response("request_id가 필요합니다.", { status: 400 });
  }

  const result = await getHealthReportByRequestId(client, { userId, requestId });

  if (!result) {
    return new Response("리포트를 찾을 수 없습니다.", { status: 404 });
  }

  const { report } = result;
  const pdfPath = typeof report.pdf_path === "string" ? report.pdf_path.trim() : null;

  if (!pdfPath) {
    return new Response("PDF가 아직 준비되지 않았습니다.", { status: 404 });
  }

  if (report.pdf_status !== "pdf_ready") {
    return new Response("PDF가 아직 준비되지 않았습니다.", { status: 404 });
  }

  const adminClient = makeAdminClient();
  let blob: Blob | null = null;
  let lastError: unknown = null;

  for (const bucket of PDF_STORAGE_BUCKETS) {
    const { data, error } = await adminClient.storage.from(bucket).download(pdfPath);
    if (!error && data) {
      blob = data;
      break;
    }
    lastError = error;
  }

  if (!blob) {
    console.error("Health report PDF download error:", lastError);
    return new Response("PDF를 찾을 수 없습니다. Storage 버킷 및 경로를 확인해 주세요.", {
      status: 404,
    });
  }

  const fileName = `health-report-${requestId}.pdf`;
  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
