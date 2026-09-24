import { getTranslations } from "next-intl/server";
import { logoutUrl } from "@/modules/auth/session";
import { Button } from "@/components/ui/button";

// Sign-out happens on the central auth service (it owns the session), which
// signs out of every aboutselphy admin surface at once and then sends the
// user back to the public link tree.
export async function SignOutButton() {
  const t = await getTranslations("Dashboard");

  return (
    <Button
      variant="outline"
      render={<a href={logoutUrl(process.env.NEXT_PUBLIC_SITE_URL)} />}
      nativeButton={false}
    >
      {t("signOut")}
    </Button>
  );
}
