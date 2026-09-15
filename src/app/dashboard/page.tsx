import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/modules/auth/server";
import { PasskeyManager } from "@/modules/auth/components/passkey-manager";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import * as profileService from "@/modules/profile/service";
import { LinkList } from "@/modules/social-links/components/link-list";
import * as socialLinksService from "@/modules/social-links/service";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardHeader } from "./dashboard-header";

// Session/profile/link data is always live and per-user -- see the matching
// comment in src/app/page.tsx for why this also avoids Next's build-time
// static-vs-dynamic probe.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, profile, links, t] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    profileService.getProfile(),
    socialLinksService.listAll(),
    getTranslations("Dashboard"),
  ]);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <DashboardHeader email={session?.user.email ?? ""} t={t} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-[clamp(1rem,4vw,2rem)] py-[clamp(1.5rem,4vw,2rem)]">
        <Tabs defaultValue="links">
          <TabsList className="mb-[clamp(1rem,3vw,1.5rem)]">
            <TabsTrigger value="links">{t("tabs.links")}</TabsTrigger>
            <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="security">{t("tabs.security")}</TabsTrigger>
          </TabsList>

          <div className="rounded-2xl border border-border bg-card p-[clamp(1rem,3vw,1.5rem)] shadow-sm">
            <TabsContent value="links">
              <LinkList initialLinks={links} rootDomain={rootDomain} />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileForm profile={profile} />
            </TabsContent>

            <TabsContent value="security">
              <PasskeyManager />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
