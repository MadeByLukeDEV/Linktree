import * as profileService from "@/modules/profile/service";
import * as socialLinksService from "@/modules/social-links/service";
import { PublicProfileHeader } from "@/modules/profile/components/public-profile-header";
import { PublicLinkList } from "@/modules/social-links/components/public-link-list";

export default async function Home() {
  const [profile, links] = await Promise.all([
    profileService.getProfile(),
    socialLinksService.listVisible(),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center gap-[clamp(1.5rem,6vw,2.5rem)] px-[clamp(1rem,6vw,2rem)] py-[clamp(2rem,8vw,4rem)]">
      <div className="flex w-full max-w-md flex-col items-center gap-[clamp(1.5rem,6vw,2.5rem)]">
        <PublicProfileHeader profile={profile} />
        <PublicLinkList links={links} />
      </div>
    </main>
  );
}
