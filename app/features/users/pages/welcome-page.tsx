import type { Route } from "./+types/welcome-page";

/**
 * Welcome page route (deprecated for email sending)
 *
 * 환영 이메일은 이제 가입 완료 시점(join action)에서 자동 발송됩니다.
 * 이 라우트는 하위 호환성을 위해 유지되며, 이메일 발송을 수행하지 않습니다.
 */
export const loader = async ({ params, request }: Route.LoaderArgs) => {
  return Response.json({
    message:
      "Welcome email is now sent at signup. This endpoint no longer sends emails.",
  });
};
