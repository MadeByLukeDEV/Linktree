"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/modules/auth/client";
import { Button } from "@/components/ui/button";

export function PasskeySignInButton() {
  const router = useRouter();
  const t = useTranslations("SignIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setError(null);
    setPending(true);
    const { error } = await authClient.signIn.passkey();
    setPending(false);
    if (error) {
      setError(error.message ?? t("passkeySignInFailed"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? t("waitingForPasskey") : t("signInWithPasskey")}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
