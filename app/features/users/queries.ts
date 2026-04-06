import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import { redirect } from "react-router";

export const getUserProfile = async (
  client: SupabaseClient<Database>,
  { username }: { username: string },
) => {
  const { data, error } = await client
    .from("profiles_view")
    .select(
      `
        profile_id,
        name,
        username,
        email,
        avatar,
        role,
        headline,
        bio,
        followers:stats->>followers,
        following:stats->>following,
        is_following
        `,
    )
    .eq("username", username)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const getUserById = async (
  client: SupabaseClient<Database>,
  { id }: { id: string },
) => {
  const { data, error } = await client
    .from("profiles_view")
    .select(
      `
        profile_id,
        name,
        username,
        avatar,
        headline,
        bio,
        role,
        marketing_consent
        `,
    )
    .eq("profile_id", id)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const getUserProducts = async (
  client: SupabaseClient<Database>,
  { username }: { username: string },
) => {
  const { data, error } = await client
    .from("product_list_view")
    .select(
      `
        *,
        profiles!products_to_profiles!inner (
            profile_id
        )
    `,
    )
    .eq("profiles.username", username);
  if (error) {
    throw error;
  }
  return data;
};

export const getUserTeams = async (
  client: SupabaseClient<Database>,
  { username }: { username: string },
) => {
  const { data, error } = await client
    .from("teams")
    .select(
      `
        *,
        profiles!inner (
            profile_id,
            username,
            avatar
        )
    `,
    )
    .eq("profiles.username", username);
  if (error) {
    throw error;
  }
  return data;
};

export const getUserPosts = async (
  client: SupabaseClient<Database>,
  { username }: { username: string },
) => {
  const { data, error } = await client
    .from("community_post_list_view")
    .select("*")
    .eq("author_username", username);
  if (error) {
    throw error;
  }
  return data;
};

export const getUserPointsByUserId = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from("profiles")
    .select("points")
    .eq("profile_id", userId)
    .single();

  if (error) {
    throw error;
  }
  return data;
};

/** 건강리포트 요청 시 포인트 차감. 잔액 부족 시 에러 반환. */
export const deductPointsForHealthReport = async (
  client: SupabaseClient<Database>,
  { userId, amount }: { userId: string; amount: number },
) => {
  const { data: profile, error: selectError } = await client
    .from("profiles")
    .select("points")
    .eq("profile_id", userId)
    .single();

  if (selectError || !profile) {
    return { success: false as const, error: "포인트 조회 실패" };
  }

  const current = Number(profile.points ?? 0);
  if (current < amount) {
    return {
      success: false as const,
      error: `포인트가 부족합니다. (보유: ${current.toLocaleString()}P, 필요: ${amount.toLocaleString()}P)`,
    };
  }

  const { error: updateError } = await client
    .from("profiles")
    .update({
      points: current - amount,
      points_updated_at: new Date().toISOString(),
    })
    .eq("profile_id", userId);

  if (updateError) {
    return { success: false as const, error: "포인트 차감 실패" };
  }

  return { success: true as const };
};

/** 웹훅 실패 등 롤백 시 포인트 복원 */
export const restorePointsForHealthReport = async (
  client: SupabaseClient<Database>,
  { userId, amount }: { userId: string; amount: number },
) => {
  const { data: profile } = await client
    .from("profiles")
    .select("points")
    .eq("profile_id", userId)
    .single();

  const current = Number(profile?.points ?? 0);
  await client
    .from("profiles")
    .update({
      points: current + amount,
      points_updated_at: new Date().toISOString(),
    })
    .eq("profile_id", userId);
};

export const getLoggedInUserId = async (client: SupabaseClient<Database>) => {
  const { data, error } = await client.auth.getUser();
  if (error || data.user === null) {
    throw redirect("/login");
  }
  return data.user.id;
};

export const getProductsByUserId = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from("products")
    .select(`name, product_id`)
    .eq("profile_id", userId);
  if (error) {
    throw error;
  }
  return data;
};

export const getNotifications = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from("notifications")
    .select(
      `
      notification_id,
      type,
      content,
      report_request_id,
      source:profiles!source_id(
        profile_id,
        name,
        username,
        avatar
      ),
      team:teams!team_id(
        team_id,
        team_name
      ),
      post:posts!post_id(
        post_id,
        title
      ),
      seen,
      created_at
      `,
    )
    .eq("target_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export const countNotifications = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { count: notificationsCount, error } = await client
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("seen", false)
    .eq("target_id", userId);
  if (error) {
    throw error;
  }
  return notificationsCount ?? 0;
};

export const existMessages = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { count: messagesCount, error } = await client
    .from("messages_view")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId)
    .eq("is_read", false);
  if (error) {
    throw error;
  }
  return messagesCount ?? 0;
};

export const getMessages = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from("messages_view")
    .select("*")
    .eq("profile_id", userId)
    .neq("other_profile_id", userId);
  if (error) {
    throw error;
  }
  return data;
};

export const getMessagesByMessagesRoomId = async (
  client: SupabaseClient<Database>,
  { messageRoomId, userId }: { messageRoomId: string; userId: string },
) => {
  const { count, error: countError } = await client
    .from("message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("message_room_id", Number(messageRoomId))
    .eq("profile_id", userId);
  if (countError) {
    throw countError;
  }
  if (count === 0) {
    throw new Error("Message room not found");
  }
  const { data, error } = await client
    .from("messages")
    .select(
      `*
      `,
    )
    .eq("message_room_id", Number(messageRoomId))
    .order("created_at", { ascending: true });
  if (error) {
    throw error;
  }
  return data;
};

export const getRoomsParticipant = async (
  client: SupabaseClient<Database>,
  { messageRoomId, userId }: { messageRoomId: string; userId: string },
) => {
  const { count, error: countError } = await client
    .from("message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("message_room_id", Number(messageRoomId))
    .eq("profile_id", userId);
  if (countError) {
    throw countError;
  }
  if (count === 0) {
    throw new Error("Message room not found");
  }
  const { data, error } = await client
    .from("message_room_members")
    .select(
      `
      profile:profiles!profile_id!inner(
        name,
        profile_id,
        avatar
      )
      `,
    )
    .eq("message_room_id", Number(messageRoomId))
    .neq("profile_id", userId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const sendMessageToRoom = async (
  client: SupabaseClient<Database>,
  {
    messageRoomId,
    message,
    userId,
  }: { messageRoomId: string; message: string; userId: string },
) => {
  const { count, error: countError } = await client
    .from("message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("message_room_id", Number(messageRoomId))
    .eq("profile_id", userId);
  if (countError) {
    throw countError;
  }
  if (count === 0) {
    throw new Error("Message room not found");
  }
  const { error } = await client.from("messages").insert({
    content: message,
    message_room_id: Number(messageRoomId),
    sender_id: userId,
  });
  if (error) {
    throw error;
  }
};

/**
 * 사용자의 리포트 요청 목록 + health_reports 조인
 * 내 리포트 페이지용
 */
export const getReportRequestsWithHealthReports = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const [requestsRes, reportsRes] = await Promise.all([
    client
      .from("report_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("health_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const requests = requestsRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const reportByRequestId = new Map(reports.map((r) => [r.request_id, r]));

  return requests.map((r) => ({
    ...r,
    healthReport: reportByRequestId.get(r.id) ?? null,
  }));
};

/**
 * request_id로 건강 리포트 조회 (상세 페이지용)
 * 본인 소유 확인 후 반환, 없으면 null
 */
export const getHealthReportByRequestId = async (
  client: SupabaseClient<Database>,
  { userId, requestId }: { userId: string; requestId: string },
) => {
  const { data: req } = await client
    .from("report_requests")
    .select(
      "id, user_id, status, created_at, current_step, last_error_message, updated_at, retry_count",
    )
    .eq("id", requestId)
    .eq("user_id", userId)
    .single();

  if (!req) return null;

  const { data: report, error: reportError } = await client
    .from("health_reports")
    .select("*")
    .eq("request_id", requestId)
    .eq("user_id", userId)
    .single();

  if (reportError) {
    console.error("getHealthReportByRequestId health_reports error:", reportError);
    return null;
  }

  return report ? { request: req, report } : null;
};

/**
 * 리포트 요청 삭제 (본인 소유만, health_reports는 cascade로 연쇄 삭제)
 */
export const deleteReportRequest = async (
  client: SupabaseClient<Database>,
  { userId, requestId }: { userId: string; requestId: string },
) => {
  const { error } = await client
    .from("report_requests")
    .delete()
    .eq("id", requestId)
    .eq("user_id", userId);

  if (error) throw error;
};

/**
 * 리포트 요청 일괄 삭제 (본인 소유만)
 */
export const deleteReportRequests = async (
  client: SupabaseClient<Database>,
  { userId, requestIds }: { userId: string; requestIds: string[] },
) => {
  if (requestIds.length === 0) return;
  const { error } = await client
    .from("report_requests")
    .delete()
    .eq("user_id", userId)
    .in("id", requestIds);
  if (error) throw error;
};

/**
 * health_reports.pdf_path, pdf_status 업데이트
 * PDF 생성 완료 시 webhook 반환값 저장 (private 버킷 → signed URL은 다운로드 시 생성)
 */
export const updateHealthReportPdfInfo = async (
  client: SupabaseClient<Database>,
  {
    requestId,
    userId,
    pdfPath,
    pdfStatus,
  }: {
    requestId: string;
    userId: string;
    pdfPath: string;
    pdfStatus: "pdf_generating" | "pdf_ready";
  },
) => {
  const { error } = await client
    .from("health_reports")
    .update({ pdf_path: pdfPath, pdf_status: pdfStatus })
    .eq("request_id", requestId)
    .eq("user_id", userId);

  if (error) throw error;
};

/**
 * health_reports.report_html upsert
 * report_json을 HTML로 변환한 결과를 저장 (상세 페이지 로더에서 사용)
 */
export const upsertReportHtml = async (
  client: SupabaseClient<Database>,
  {
    requestId,
    userId,
    reportHtml,
  }: { requestId: string; userId: string; reportHtml: string },
) => {
  const { error } = await client
    .from("health_reports")
    .update({ report_html: reportHtml })
    .eq("request_id", requestId)
    .eq("user_id", userId);

  if (error) throw error;
};
