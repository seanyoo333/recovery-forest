const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function loader() {
  const DOMAIN =
    process.env.SITE_URL ?? "https://recovery-forest.evidence-base.ai";
  const now = new Date().toISOString();

  const entries = [
    { url: "/", lastmod: now },
    { url: "/recommend", lastmod: now },
    { url: "/about", lastmod: now },
  ];

  const urls = entries
    .map(
      ({ url, lastmod }) => `  <url>
    <loc>${escapeXml(`${DOMAIN}${url}`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
