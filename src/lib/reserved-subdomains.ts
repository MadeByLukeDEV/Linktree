// Subdomain labels that must never be treated as a dashboard-defined
// forward target -- shared by the social-links create/edit validation
// (src/modules/social-links/schema.ts) and the proxy's main-app-vs-forward
// detection (src/proxy.ts), so the two can't drift out of sync.
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "social",
  "api",
  "app",
  "admin",
  "dashboard",
  "mail",
  "ftp",
  "localhost",
  // Static joke page (src/app/onlyfans/), rewritten straight to a route in
  // this app by src/proxy.ts -- not a real dashboard-configurable forward.
  "onlyfans",
]);
