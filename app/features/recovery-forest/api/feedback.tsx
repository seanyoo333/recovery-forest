import type { Route } from "./+types/feedback";

import { makeRecoveryServerClient } from "~/lib/supabase.server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const sessionId = String(form.get("session_id") ?? "");
  const forestId = String(form.get("forest_id") ?? "");
  const ratingRaw = Number(form.get("rating") ?? 0);
  const comment = String(form.get("comment") ?? "").slice(0, 1000) || null;

  if (!sessionId || !forestId || ratingRaw < 1 || ratingRaw > 5) {
    return Response.json(
      {
        ok: false,
        error: { code: "VALIDATION_FAILED", message: "잘못된 입력이에요." },
      },
      { status: 400 },
    );
  }

  const [client] = makeRecoveryServerClient(request);
  const { error } = await client.from("recommendation_feedback").insert({
    session_id: sessionId,
    forest_place_id: forestId,
    rating: ratingRaw,
    comment,
  });
  if (error) {
    return Response.json(
      {
        ok: false,
        error: { code: "DB_FAILED", message: "피드백을 저장하지 못했어요." },
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, data: { saved: true } });
}

export default function FeedbackApiRoute() {
  return null;
}
