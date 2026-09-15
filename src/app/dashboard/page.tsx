import { headers } from "next/headers";
import { auth } from "@/modules/auth/server";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { PasskeyManager } from "@/modules/auth/components/passkey-manager";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col gap-6 p-[clamp(1rem,4vw,2rem)]">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Signed in as {session?.user.email}. Social link and profile
          management arrives in the next phase.
        </p>
        <div>
          <SignOutButton />
        </div>
      </div>

      <PasskeyManager />
    </div>
  );
}
