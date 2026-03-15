/**
 * MVP Feature Flags
 *
 * false = 숨김 (MVP 런칭용)
 * true = 표시 (기능 재활성화 시)
 *
 * 한 곳에서 모든 기능 노출을 제어합니다.
 * 향후 기능을 다시 켜려면 해당 값을 true로 변경하면 됩니다.
 */
export const FEATURES = {
  /** 사용자 간 개인 메시지 (DM) */
  userMessages: false,
  /** AI 챗봇 */
  aiChat: false,
  /** 디버그 메뉴 (Sentry, Analytics) */
  debugMenu: false,
  /** 테마 전환 (라이트/다크/시스템) */
  themeSwitcher: false,
  /** 스페인어 언어 옵션 */
  spanishLocale: false,
} as const;
