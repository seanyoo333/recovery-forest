import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  DATA_GO_KR_SERVICE_KEY: z.string().min(1).optional(),
  KMA_API_KEY: z.string().min(1).optional(),
  AIRKOREA_API_KEY: z.string().min(1).optional(),

  FOREST_HEALING_API_URL: z.string().url().optional(),
  FOREST_TRAIL_API_URL: z.string().url().optional(),
  URBAN_FOREST_API_URL: z.string().url().optional(),
  KMA_SHORT_FORECAST_URL: z.string().url().optional(),
  AIRKOREA_REALTIME_URL: z.string().url().optional(),

  N8N_WEBHOOK_URL: z.string().url().optional(),
  N8N_WEBHOOK_SECRET: z.string().min(1).optional(),
  // Evidence Engine 처방 생성 webhook (PRESCRIPTION_MODE=n8n 일 때 사용)
  N8N_PRESCRIBE_WEBHOOK_URL: z.string().url().optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),

  // Evidence Engine 여정: 처방 생성 경로. stub=외부 API 없이 코드로 생성(데모 안전),
  // n8n=n8n 워크플로우가 처방 생성.
  PRESCRIPTION_MODE: z.enum(["stub", "n8n"]).default("stub"),

  // 리포트 매직링크 이메일 발송(선택). 없으면 화면에 링크를 직접 노출(무이메일 데모).
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  SENTRY_DSN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const keys = Object.keys(flat).join(", ");
    throw new Error(
      `Invalid or missing required environment variables: ${keys}. ` +
        `See .env.example for the full list.`,
    );
  }
  cached = parsed.data;
  return cached;
}
