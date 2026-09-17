import { Suspense } from "react";
import type { Metadata } from "next";
import * as profileService from "@/modules/profile/service";
import * as socialLinksService from "@/modules/social-links/service";
import * as twitchService from "@/modules/twitch/service";
import { PublicProfileHeader } from "@/modules/profile/components/public-profile-header";
import { PublicLinkList } from "@/modules/social-links/components/public-link-list";
import { YoutubeSection } from "@/modules/youtube/components/youtube-section";
import { YoutubeSkeleton } from "@/modules/youtube/components/youtube-skeleton";
import { isYoutubeConfigured } from "@/modules/youtube/service";
import { LocaleSwitcher } from "@/modules/i18n/components/locale-switcher";
import { ThemeToggle } from "@/modules/theme/components/theme-toggle";

// Reads live profile/link data every request; also avoids Next's build-time
// static-vs-dynamic probe attempting to prerender this page (which would
// try to construct the Prisma client without DATABASE_URL available during
// a Docker build and log a noisy, though harmless, caught error).
export const dynamic = "force-dynamic";

// Reflects the real profile in the tab title, search results, and link
// previews -- opengraph-image.tsx (same directory) independently reads the
// same data to render the actual preview image; Next wires the two
// together automatically via the file-convention route it generates.
export async function generateMetadata(): Promise<Metadata> {
  const profile = await profileService.getProfile();
  const displayName = profile?.displayName || "AboutSelphy";
  const description =
    profile?.bio || "Find AboutSelphy everywhere, all in one place.";

  return {
    title: displayName,
    description,
    openGraph: { title: displayName, description },
    // Next doesn't deep-merge a nested field like `twitter` across
    // layout/page metadata -- this object entirely replaces the layout's,
    // so `card` has to be repeated here or it silently reverts to Next's
    // "summary" default instead of the large-image card set in layout.tsx.
    twitter: { card: "summary_large_image", title: displayName, description },
  };
}

export default async function Home() {
  const [profile, groupedLinks, twitchLive] = await Promise.all([
    profileService.getProfile(),
    socialLinksService.listGroupedVisible(),
    twitchService.isLive(),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center gap-[clamp(1.5rem,6vw,2.5rem)] px-[clamp(1rem,6vw,2rem)] py-[clamp(2rem,8vw,4rem)]">
      <div className="flex w-full max-w-lg flex-col items-center gap-[clamp(1.5rem,6vw,2.5rem)]">
        <PublicProfileHeader profile={profile} />
        {isYoutubeConfigured() ? (
          <Suspense fallback={<YoutubeSkeleton />}>
            <YoutubeSection />
          </Suspense>
        ) : null}
        <PublicLinkList
          ungrouped={groupedLinks.ungrouped}
          groups={groupedLinks.groups}
          twitchLive={twitchLive}
        />
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
