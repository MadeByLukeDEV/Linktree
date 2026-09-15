import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/modules/auth/server";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { PasskeyManager } from "@/modules/auth/components/passkey-manager";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import * as profileService from "@/modules/profile/service";
import { LinkList } from "@/modules/social-links/components/link-list";
import * as socialLinksService from "@/modules/social-links/service";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LocaleSwitcher } from "@/modules/i18n/components/locale-switcher";
import { ThemeToggle } from "@/modules/theme/components/theme-toggle";

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
    <div className="flex flex-col gap-4 p-[clamp(1rem,4vw,2rem)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("signedInAs", { email: session?.user.email ?? "" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>

      <Tabs defaultValue="links">
        <TabsList>
          <TabsTrigger value="links">{t("tabs.links")}</TabsTrigger>
          <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
          <TabsTrigger value="security">{t("tabs.security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="links">
          <LinkList initialLinks={links} rootDomain={rootDomain} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileForm profile={profile} />
        </TabsContent>

        <TabsContent value="security">
          <PasskeyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
