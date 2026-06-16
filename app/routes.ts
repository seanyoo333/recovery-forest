import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  route("/robots.txt", "core/screens/robots.ts"),
  route("/sitemap.xml", "core/screens/sitemap.ts"),

  layout("core/layouts/navigation.layout.tsx", [
    index("features/recovery-forest/pages/landing-page.tsx"),

    // K-POMS-B 기반 AI 맞춤 처방 — 데모 핵심 흐름(랜딩 → 입력 → 결과)
    ...prefix("/prescribe", [
      index("features/recovery-forest/pages/prescribe-input-page.tsx"),
      route(
        "/result",
        "features/recovery-forest/pages/prescribe-result-page.tsx",
      ),
      route(
        "/itinerary",
        "features/recovery-forest/pages/prescribe-itinerary-page.tsx",
      ),
    ]),

    route("/about", "features/recovery-forest/pages/about-page.tsx"),

    route("/error", "core/screens/error.tsx"),
  ]),

  ...prefix("/api", [
    route("/prescribe", "features/recovery-forest/api/prescribe.tsx"),
  ]),
] satisfies RouteConfig;
