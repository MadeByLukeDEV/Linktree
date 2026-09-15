import { headers } from "next/headers";
import { auth } from "@/modules/auth/server";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { PasskeyManager } from "@/modules/auth/components/passkey-manager";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import * as profileService from "@/modules/profile/service";
import { LinkList } from "@/modules/social-links/components/link-list";
import * as socialLinksService from "@/modules/social-links/service";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function DashboardPage() {
  const [session, profile, links] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    profileService.getProfile(),
    socialLinksService.listAll(),
  ]);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";

  return (
    <div className="flex flex-col gap-4 p-[clamp(1rem,4vw,2rem)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session?.user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <Tabs defaultValue="links">
        <TabsList>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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
