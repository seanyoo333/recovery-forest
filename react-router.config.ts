import type { Config } from "@react-router/dev/config";

import { vercelPreset } from "@vercel/react-router/vite";

export default {
  ssr: true,
  async prerender() {
    return ["/sitemap.xml", "/robots.txt"];
  },
  presets: [
    ...(process.env.VERCEL_ENV === "production" ? [vercelPreset()] : []),
  ],
} satisfies Config;
