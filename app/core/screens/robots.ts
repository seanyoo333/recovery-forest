export async function loader() {
  return new Response(
    `User-agent: *
Disallow: /api
Allow: /

Sitemap: ${process.env.SITE_URL ?? "https://recovery-forest.evidence-base.ai"}/sitemap.xml`,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    },
  );
}
