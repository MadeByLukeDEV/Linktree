import type { getTranslations } from "next-intl/server";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { LocaleSwitcher } from "@/modules/i18n/components/locale-switcher";
import { ThemeToggle } from "@/modules/theme/components/theme-toggle";

export function DashboardHeader({
  name,
  t,
}: {
  name: string;
  t: Awaited<ReturnType<typeof getTranslations<"Dashboard">>>;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-[clamp(1rem,4vw,2rem)] py-[clamp(0.75rem,2vw,1rem)]">
        <div className="flex flex-col">
          <span className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold tracking-tight">
            {t("title")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("welcomeBack", { name })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
