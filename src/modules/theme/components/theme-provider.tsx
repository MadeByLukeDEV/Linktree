"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// next-themes renders its pre-paint script as a React <script>. That runs
// from the server HTML. When React creates the element on the client
// instead (after a render error, or a client-side remount), it never runs
// it and warns "Encountered a script tag while rendering React component".
// A non-JavaScript type in the browser marks it as a data block, which React
// doesn't warn about; the server keeps a runnable type. The differing
// attribute is fine: next-themes sets suppressHydrationWarning.
const SCRIPT_PROPS = {
  type: typeof window === "undefined" ? "text/javascript" : "application/json",
};

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={SCRIPT_PROPS}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
