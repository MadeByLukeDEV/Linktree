import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Matches the robots: { index: false } metadata on these pages
      // (belt-and-suspenders -- a crawler that ignores per-page meta tags
      // still gets steered away here) plus the auth API route, which has
      // nothing worth indexing either way.
      disallow: ["/dashboard", "/sign-in", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
