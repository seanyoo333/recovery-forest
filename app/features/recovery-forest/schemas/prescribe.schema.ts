import { z } from "zod";

import { USER_TYPES } from "./input.schema";

/**
 * /api/prescribe 요청 = 처방 엔진(prescription_engine.py)의 네이티브 계약.
 * 좌표·시점을 직접 받는다(엔진을 그대로 감싸는 얇은 API).
 */
export const prescribeRequestSchema = z.object({
  goal: z.string().min(1, "목표를 입력해주세요"),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  user_type: z.enum(USER_TYPES),
  month: z.number().int().min(1).max(12),
  hour: z.number().int().min(0).max(23),
});

export type PrescribeRequest = z.infer<typeof prescribeRequestSchema>;
