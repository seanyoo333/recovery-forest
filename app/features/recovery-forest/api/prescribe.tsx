import type { Route } from "./+types/prescribe";

import { prescribeRequestSchema } from "../schemas/prescribe.schema";
import { prescribe } from "../services/forest-ranking";

/**
 * POST /api/prescribe — 처방 엔진(3축)을 그대로 감싸는 얇은 JSON API.
 * 입력은 엔진 네이티브 계약({goal, lat, lon, user_type, month, hour}).
 * 데모는 엔진 내장 SAMPLE_FORESTS 로 동작(운영시 forest_places 주입).
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "POST 만 허용됩니다." } },
      { status: 405 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "JSON 본문을 확인해주세요." } },
      { status: 400 },
    );
  }

  const parsed = prescribeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "입력값을 다시 확인해주세요.",
          detail: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  return Response.json({ ok: true, data: prescribe(parsed.data) });
}

export default function PrescribeApiRoute() {
  return null;
}
