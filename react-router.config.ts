import type { Config } from "@react-router/dev/config";

import { sentryOnBuildEnd } from "@sentry/react-router";
import { vercelPreset } from "@vercel/react-router/vite";

import {
  resolveBlogMdxFilePaths,
  slugFromFileName,
} from "./app/features/blog/lib/blog-mdx-files";

declare module "react-router" {
  interface Future {
    unstable_middleware: true;
  }
}

const blogPaths = await resolveBlogMdxFilePaths();
const urls = blogPaths.map((filePath) => `/blog/${slugFromFileName(filePath)}`);

export default {
  ssr: true,
  async prerender() {
    return [
      "/legal/terms-of-service",
      "/legal/privacy-policy",
      "/legal/refund-policy",
      "/blog",
      "/sitemap.xml",
      "/robots.txt",
      ...urls,
    ];
  },
  presets: [
    ...(process.env.VERCEL_ENV === "production" ? [vercelPreset()] : []),
  ],
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    if (
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT &&
      process.env.SENTRY_AUTH_TOKEN
    ) {
      await sentryOnBuildEnd({
        viteConfig,
        reactRouterConfig,
        buildManifest,
      });
    }
  },
} satisfies Config;
