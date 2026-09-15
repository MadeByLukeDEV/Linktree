"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocaleAction } from "@/modules/i18n/actions";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LocaleSwitcher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant={locale === "en" ? "default" : "outline"}
        size="sm"
        disabled={isPending}
        onClick={() => switchTo("en")}
      >
        {t("english")}
      </Button>
      <Button
        type="button"
        variant={locale === "de" ? "default" : "outline"}
        size="sm"
        disabled={isPending}
        onClick={() => switchTo("de")}
      >
        {t("german")}
      </Button>
    </div>
  );
}
