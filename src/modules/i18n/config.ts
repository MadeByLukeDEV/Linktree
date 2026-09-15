export const SUPPORTED_LOCALES = ["en", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function detectLocaleFromAcceptLanguage(
  header: string | null
): Locale {
  if (!header) return DEFAULT_LOCALE;

  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0]!.trim().split("-")[0]!.toLowerCase());

  for (const lang of preferred) {
    if (isSupportedLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}
