import type { MetadataRoute } from "next";

// Deliberately just the public profile page -- /onlyfans is a joke page,
// not something worth actively promoting to search engines via a sitemap
// entry (robots.ts still allows crawling it, this just doesn't advertise
// it as a priority page).
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
