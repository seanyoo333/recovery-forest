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

    ...prefix("/recommend", [
      index("features/recovery-forest/pages/input-page.tsx"),
      route(
        "/results/:sessionId",
        "features/recovery-forest/pages/results-page.tsx",
      ),
    ]),

    route(
      "/forests/:forestId",
      "features/recovery-forest/pages/forest-detail-page.tsx",
    ),

    route("/about", "features/recovery-forest/pages/about-page.tsx"),

    // Evidence Engine 여정 (매직링크 토큰 기반)
    ...prefix("/journey", [
      route("/start", "features/recovery-forest/pages/consent-page.tsx"),
      route("/insights", "features/recovery-forest/pages/insights-page.tsx"),
      route(
        "/:token/pre-survey",
        "features/recovery-forest/pages/pre-survey-page.tsx",
      ),
      route(
        "/:token/prescription",
        "features/recovery-forest/pages/prescription-page.tsx",
      ),
      route(
        "/:token/post-survey",
        "features/recovery-forest/pages/post-survey-page.tsx",
      ),
      route("/:token/report", "features/recovery-forest/pages/report-page.tsx"),
    ]),

    route("/error", "core/screens/error.tsx"),
  ]),

  ...prefix("/api", [
    route("/recommend", "features/recovery-forest/api/recommend.tsx"),
    route("/prescribe", "features/recovery-forest/api/prescribe.tsx"),
    route("/feedback", "features/recovery-forest/api/feedback.tsx"),
    route("/journey-start", "features/recovery-forest/api/journey-start.tsx"),
    route(
      "/journey/:token/pre-survey",
      "features/recovery-forest/api/pre-survey.tsx",
    ),
    route(
      "/journey/:token/post-survey",
      "features/recovery-forest/api/post-survey.tsx",
    ),
  ]),
] satisfies RouteConfig;
