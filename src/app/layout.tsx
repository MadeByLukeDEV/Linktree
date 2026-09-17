import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "@/modules/theme/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AnimatedBackground } from "@/components/effects/animated-background";
import { CustomCursor } from "@/components/effects/custom-cursor";
import "./globals.css";

// Named "--font-sans" directly so it plugs into globals.css's
// `--font-sans: var(--font-sans)` indirection without touching that file.
const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// metadataBase resolves any relative OG/Twitter image URL (including the
// ones next/og's opengraph-image.tsx files generate) into an absolute one
// -- without it, Next falls back to a localhost URL that social media
// crawlers and search engines can't reach, and warns about it at build
// time. Per-page metadata (title, description, robots) overrides these
// site-wide defaults; openGraph/twitter here just cover pages that don't
// set their own.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AboutSelphy",
    template: "%s — AboutSelphy",
  },
  description: "Find AboutSelphy everywhere, all in one place.",
  openGraph: {
    siteName: "AboutSelphy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <NextIntlClientProvider>
            <AnimatedBackground />
            <CustomCursor />
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
