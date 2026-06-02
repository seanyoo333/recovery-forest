import {
  type CookieOptionsWithName,
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "./env.server";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptionsWithName;
};

export function makeRecoveryServerClient(
  request: Request,
): [SupabaseClient, Headers] {
  const env = getServerEnv();
  const headers = new Headers();
  const client = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const parsed = parseCookieHeader(request.headers.get("Cookie") ?? "");
        return parsed.map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append(
            "Set-Cookie",
            serializeCookieHeader(name, value, options ?? {}),
          ),
        );
      },
    },
  });
  return [client, headers];
}

let cachedServiceClient: SupabaseClient | null = null;

/**
 * 서버 전용 service-role 클라이언트. RLS 를 우회한다.
 * Evidence Engine 여정 테이블은 service-role 전용 RLS 이므로, 여정 관련
 * server action / loader 는 이 클라이언트로 접근한다. 절대 브라우저로 노출 금지.
 */
export function makeRecoveryServiceClient(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;
  const env = getServerEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for Evidence Engine journey routes.",
    );
  }
  cachedServiceClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cachedServiceClient;
}
