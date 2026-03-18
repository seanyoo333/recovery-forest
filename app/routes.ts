/**
 * Application Routes Configuration
 *
 * This file defines all routes for the application using React Router's
 * file-based routing system. Routes are organized by feature and access level.
 *
 * The structure uses layouts for shared UI elements and prefixes for route grouping.
 * This approach creates a hierarchical routing system that's both maintainable and scalable.
 */
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
  ...prefix("/debug", [
    // You should delete this in production.
    route("/sentry", "debug/sentry.tsx"),
    route("/analytics", "debug/analytics.tsx"),
  ]),
  // API Routes. Routes that export actions and loaders but no UI.
  ...prefix("/api", [
    ...prefix("/settings", [
      route("/theme", "features/settings/api/set-theme.tsx"),
      route("/locale", "features/settings/api/set-locale.tsx"),
    ]),
    ...prefix("/users", [
      index("features/users/api/delete-account.tsx"),
      route("/password", "features/users/api/change-password.tsx"),
      route("/email", "features/users/api/change-email.tsx"),
      route("/profile", "features/users/api/edit-profile.tsx"),
      route("/providers", "features/users/api/connect-provider.tsx"),
      route(
        "/providers/:provider",
        "features/users/api/disconnect-provider.tsx",
      ),
    ]),

    ...prefix("/cron", [route("/mailer", "features/cron/api/mailer.tsx")]),
    ...prefix("/blog", [
      route("/og", "features/blog/api/og.tsx"),
      route("/:postId/upvote", "features/blog/api/upvote.tsx"),
    ]),
    ...prefix("/clinic", [
      route("/upload-photo", "features/clinic/api/upload-photo.tsx"),
    ]),
    route(
      "/health-report-request",
      "features/users/api/health-report-request.tsx",
    ),
    route(
      "/health-report-complete-payment",
      "features/users/api/health-report-complete-payment.tsx",
    ),
    route(
      "/health-report-pdf",
      "features/users/api/health-report-pdf.tsx",
    ),
    route(
      "/health-report-pdf-download",
      "features/users/api/health-report-pdf-download.tsx",
    ),
  ]),

  layout("core/layouts/navigation.layout.tsx", [
    route("/auth/confirm", "features/auth/screens/confirm.tsx"),
    index("features/home/screens/home.tsx"),
    route("/error", "core/screens/error.tsx"),
    // Landing page is accessible to both authenticated and unauthenticated users
    route("/landing", "features/home/screens/landing.tsx"),

    layout("core/layouts/public.layout.tsx", [
      // Routes that should only be visible to unauthenticated users.
      route("/login", "features/auth/screens/login.tsx"),
      route("/join", "features/auth/screens/join.tsx"),
      ...prefix("/auth", [
        route("/api/resend", "features/auth/api/resend.tsx"),
        route(
          "/forgot-password/reset",
          "features/auth/screens/forgot-password.tsx",
        ),
        route("/magic-link", "features/auth/screens/magic-link.tsx"),
        ...prefix("/otp", [
          route("/start", "features/auth/screens/otp/start.tsx"),
          route("/complete", "features/auth/screens/otp/complete.tsx"),
        ]),
        ...prefix("/social", [
          route("/start/:provider", "features/auth/screens/social/start.tsx"),
          route(
            "/complete/:provider",
            "features/auth/screens/social/complete.tsx",
          ),
        ]),
      ]),
    ]),

    layout("core/layouts/private.layout.tsx", { id: "private-auth" }, [
      ...prefix("/auth", [
        route(
          "/forgot-password/create",
          "features/auth/screens/new-password.tsx",
        ),
        route("/email-verified", "features/auth/screens/email-verified.tsx"),
      ]),
      // Routes that should only be visible to authenticated users.
      route("/logout", "features/auth/screens/logout.tsx"),
    ]),

    route("/contact", "features/contact/screens/contact-us.tsx"),

    // 커뮤니티, 천연물질, 블로그: 로그인 필요
    layout(
      "core/layouts/private.layout.tsx",
      { id: "private-community" },
      [
        ...prefix("community", [
          index("features/community/pages/community-page.tsx"),
          route("/submit", "features/community/pages/submit-post-page.tsx"),
          route("/:postId", "features/community/pages/post-page.tsx"),
          route("/:postId/edit", "features/community/pages/edit-post-page.tsx"),
          route(
            "/:postId/upvote",
            "features/community/pages/upvote-post-page.tsx",
          ),
        ]),
      ],
    ),

    layout(
      "core/layouts/private.layout.tsx",
      { id: "private-products" },
      [
    ...prefix("products", [
      index("features/products/pages/products-page.tsx"),
      layout("features/products/layouts/leaderboard-layout.tsx", [
        ...prefix("leaderboards", [
          index("features/products/pages/leaderboard-page.tsx"),
          route(
            "/daily/:year/:month/:day",
            "features/products/pages/daily-leaderboard-page.tsx",
          ),
          route(
            "/weekly/:year/:week",
            "features/products/pages/weekly-leaderboard-page.tsx",
          ),
          route(
            "/monthly/:year/:month",
            "features/products/pages/monthly-leaderboard-page.tsx",
          ),
          route(
            "/yearly/:year",
            "features/products/pages/yearly-leaderboard-page.tsx",
          ),
          route(
            "/:period",
            "features/products/pages/leaderboards-redirection-page.tsx",
          ),
        ]),
      ]),

      ...prefix("/:productId", [
        index("features/products/pages/product-redirect-page.tsx"),
        layout("features/products/layouts/product-overview-layout.tsx", [
          route(
            "/overview",
            "features/products/pages/product-overview-page.tsx",
          ),
          ...prefix("/reviews", [
            index("features/products/pages/product-reviews-page.tsx"),
          ]),
        ]),
        route("/visit", "features/products/pages/product-visit-page.tsx"),
        route("/upvote", "features/products/pages/product-upvote-page.tsx"),
      ]),

      ...prefix("categories", [
        index("features/products/pages/categories-page.tsx"),
        route("/:category", "features/products/pages/category-page.tsx"),
      ]),
      ...prefix("search", [index("features/products/pages/search-page.tsx")]),

      // 관리자 전용 제품 등록 페이지
      layout(
        "core/layouts/private.layout.tsx",
        { id: "private-admin-products" },
        [
          ...prefix("submit", [
            index("features/products/pages/submit-product.tsx"),
          ]),
          ...prefix("promote", [
            index("features/products/pages/promote-product.tsx"),
          ]),
        ],
      ),
    ]),
    ]),

    ...prefix("teams", [
      index("features/teams/pages/teams-page.tsx"),
      route("/:teamId", "features/teams/pages/team-page.tsx"),
      route("/submit", "features/teams/pages/submit-team-page.tsx"),
    ]),

    ...prefix("programs", [
      index("features/teams/pages/programs-page.tsx"),
      route("/:programId", "features/teams/pages/program-page.tsx"),
    ]),

    ...prefix("clinic", [
      index("features/clinic/pages/clinics-page.tsx"),
      ...prefix("/:clinicId", [
        index("features/clinic/pages/clinic-redirect-page.tsx"),
        layout("features/clinic/layouts/clinic-overview-layout.tsx", [
          route("/overview", "features/clinic/pages/clinic-overview-page.tsx"),
          ...prefix("/reviews", [
            index("features/clinic/pages/clinic-reviews-page.tsx"),
          ]),
        ]),
      ]),
      // 관리자 전용 병원 등록 페이지
      layout(
        "core/layouts/private.layout.tsx",
        { id: "private-admin-clinic" },
        [route("/submit", "features/clinic/pages/submit-clinic-page.tsx")],
      ),
    ]),

    ...prefix("payments", [
      route("/checkout", "features/payments/screens/checkout.tsx"),
      layout("core/layouts/private.layout.tsx", { id: "private-payments" }, [
        route("/", "features/payments/screens/payments.tsx"),
        route("/success", "features/payments/screens/success.tsx"),
        route("/failure", "features/payments/screens/failure.tsx"),
      ]),
    ]),
    ...prefix("/users/:username", [
      layout("features/users/layouts/profile-layout.tsx", [
        index("features/users/pages/profile-page.tsx"),
        route("/teams", "features/users/pages/profile-teams-page.tsx"),
        route("/posts", "features/users/pages/profile-posts-page.tsx"),
        route("/payments", "features/users/pages/profile-payments-page.tsx"),
      ]),
      route("/messages", "features/users/pages/send-message-page.tsx"),
      route("/welcome", "features/users/pages/welcome-page.tsx"),
      route("/follow", "features/users/pages/follow-page.tsx"),
    ]),
  ]),

  // AI 챗봇 기능 (로그인한 사용자만 접근 가능)
  layout("core/layouts/private.layout.tsx", { id: "private-chat" }, [
    ...prefix("/chat", [
      layout("features/chat/layouts/chat.layout.tsx", [
        index("features/chat/pages/chat-page.tsx"),
        ...prefix("/botmessages", [
          index("features/chat/pages/bot-messages-page.tsx"),
          route(
            "/:botMessageRoomId",
            "features/chat/pages/bot-message-page.tsx",
          ),
          route(
            "/:botMessageRoomId/hide",
            "features/chat/api/hide-bot-message.tsx",
          ),
        ]),
        ...prefix("/api", [
          route("/langchain", "features/chat/api/langchain.tsx"),
          route("/create-room", "features/chat/api/create-room.tsx"),
          route("/stream-message", "features/chat/api/stream-message.tsx"),
          route("/save-ai-message", "features/chat/api/save-ai-message.tsx"),
          route(
            "/save-health-bookmark",
            "features/chat/api/save-health-bookmark.tsx",
          ),
        ]),
      ]),
    ]),
  ]),

  layout("core/layouts/private.layout.tsx", { id: "private-dashboard" }, [
    layout("features/users/layouts/dashboard.layout.tsx", [
      ...prefix("/my", [
        ...prefix("/dashboard", [
          index("features/users/dashboard/pages/dashboard.tsx"),
          route(
            "/health",
            "features/users/dashboard/pages/dashboard-health.tsx",
          ),
          route(
            "/health/consent",
            "features/users/dashboard/pages/medical-consent.tsx",
          ),
          route(
            "/health/submit",
            "features/users/dashboard/pages/dashboard-health-submit.tsx",
          ),
          route(
            "/health/report",
            "features/users/dashboard/pages/dashboard-health-report-products.tsx",
          ),
          route(
            "/health/report/:productId",
            "features/users/dashboard/pages/dashboard-health-report.tsx",
          ),
          route(
            "/health/report/:productId/:requestId",
            "features/users/dashboard/pages/dashboard-health-report-detail.tsx",
          ),
          route(
            "/bookmarks",
            "features/users/dashboard/pages/dashboard-bookmarks.tsx",
          ),
          route(
            "/bookmarks/:bookmarkId/question",
            "features/users/dashboard/pages/bookmark-question-page.tsx",
          ),
          route(
            "/health-habits",
            "features/users/dashboard/pages/dashboard-health-habits.tsx",
          ),
          route(
            "/metabolic-fuel",
            "features/users/dashboard/pages/dashboard-metabolic-fuel.tsx",
          ),
        ]),

        ...prefix("/messages", [
          index("features/users/screens/messages.tsx"),
          route("/:messageRoomId", "features/users/screens/message.tsx"),
          route(
            "/:messageRoomId/isRead",
            "features/users/api/is-read-messageroom-card.tsx",
          ),
          route(
            "/:messageRoomId/hide",
            "features/users/api/hide-message-room-page.tsx",
          ),
          route(
            "/:messageId/delete",
            "features/users/api/delete-messageroom-card.tsx",
          ),
        ]),
        ...prefix("/profile", [
          route("/", "features/users/api/my/profile/my-profile-page.tsx"),
          route(
            "/settings",
            "features/users/api/my/settings/settings-page.tsx",
          ),
        ]),

        route("/account", "features/users/pages/account.tsx"),
        route("/notifications", "features/users/screens/notifications.tsx"),
        route(
          "/notifications/:notificationId/see",
          "features/users/api/see-notification-page.tsx",
        ),
        route(
          "/notifications/:notificationId/delete",
          "features/users/api/delete-notification-page.tsx",
        ),

        // 관리자 전용 대시보드
        route("/admin-dashboard", "features/admin/pages/admin-dashboard.tsx"),
        // 관리자 제품 관리 페이지들
        route(
          "/admin-dashboard/products",
          "features/admin/pages/admin-products-list.tsx",
        ),
        route(
          "/admin-dashboard/products/chart",
          "features/admin/pages/admin-product-chart.tsx",
        ),
        route(
          "/admin-dashboard/products/:productId",
          "features/admin/pages/admin-product-detail.tsx",
        ),
        // 관리자 병원 관리 페이지들
        route(
          "/admin-dashboard/clinics",
          "features/admin/pages/admin-clinic-list.tsx",
        ),
        route(
          "/admin-dashboard/clinics/:clinicId",
          "features/admin/pages/admin-clinic-detail.tsx",
        ),
        // 관리자 블로그 관리 페이지
        route(
          "/admin-dashboard/blog",
          "features/blog/pages/admin-blog-page.tsx",
        ),
      ]),
    ]),
  ]),

  ...prefix("/legal", [route("/:slug", "features/legal/screens/policy.tsx")]),

  // 블로그: 로그인 필요
  layout("core/layouts/private.layout.tsx", { id: "private-blog" }, [
    layout("features/blog/layouts/blog.layout.tsx", [
      ...prefix("/blog", [
        index("features/blog/pages/posts.tsx"),
        route("/:slug", "features/blog/pages/post.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
