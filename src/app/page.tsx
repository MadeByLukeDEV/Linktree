import { Suspense } from "react";
import * as profileService from "@/modules/profile/service";
import * as socialLinksService from "@/modules/social-links/service";
import { PublicProfileHeader } from "@/modules/profile/components/public-profile-header";
import { PublicLinkList } from "@/modules/social-links/components/public-link-list";
import { YoutubeSection } from "@/modules/youtube/components/youtube-section";
import { YoutubeSkeleton } from "@/modules/youtube/components/youtube-skeleton";
import { isYoutubeConfigured } from "@/modules/youtube/service";
import { LocaleSwitcher } from "@/modules/i18n/components/locale-switcher";
import { ThemeToggle } from "@/modules/theme/components/theme-toggle";

export default async function Home() {
  const [profile, links] = await Promise.all([
    profileService.getProfile(),
    socialLinksService.listVisible(),
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
        <PublicLinkList links={links} />
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
