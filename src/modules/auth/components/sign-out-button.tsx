import { getTranslations } from "next-intl/server";
import { signOutEndpoint } from "@/modules/auth/session";
import { Button } from "@/components/ui/button";

// A plain cross-origin form POST to the central auth service: it owns the
// session, signs out of every aboutselphy admin surface at once, and sends
// the browser straight back to the public link tree. No client JS needed.
export async function SignOutButton() {
  const t = await getTranslations("Dashboard");

  return (
    <form method="post" action={signOutEndpoint()}>
      <input type="hidden" name="redirect" value={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />
      <Button variant="outline" type="submit">
        {t("signOut")}
      </Button>
    </form>
  );
}
