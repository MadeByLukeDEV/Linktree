// Content-Security-Policy, built per request with a fresh nonce (src/proxy.ts),
// same approach as the Main app. Every page already renders per request (the
// root layout reads the locale from cookies/headers), so Next can put the
// nonce on its scripts; the layout passes it to next-themes' inline script.
//
// Add an origin only together with the feature that needs it, and say why.

const isDev = process.env.NODE_ENV === "development";

export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function buildCsp(
  nonce: string,
  // The central auth service: the dashboard's sign-out is a form POST to it.
  authOrigin: string,
): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic': scripts loaded by a nonce'd script are trusted too
    // (Next's chunk loading). Dev needs 'unsafe-eval' for React's tooling.
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // Inline styles stay allowed: Framer Motion and sonner need them. A nonce
    // here would make browsers ignore 'unsafe-inline'.
    "style-src": ["'self'", "'unsafe-inline'"],
    // Any https image: the profile avatar and a link's "Icon URL" override
    // are arbitrary URLs the owner enters, and YouTube thumbnails come from
    // i.ytimg.com. Images can't run code; scripts are what the nonce guards.
    "img-src": ["'self'", "data:", "blob:", "https:"],
    // next/font self-hosts the font.
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    // Nothing is embedded (the YouTube card links out).
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", authOrigin],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
