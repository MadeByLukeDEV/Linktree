import { NextResponse, type NextRequest } from "next/server";
import { getStaffSession, loginUrl } from "@/modules/auth/session";
import { resolveSubdomain } from "@/modules/redirects/service";
import { RESERVED_SUBDOMAINS } from "@/lib/reserved-subdomains";
import { canAccessDashboard } from "@/modules/auth/roles";
import { buildCsp, createNonce } from "@/lib/security/csp";

const CSP_HEADER = "Content-Security-Policy";

/**
 * Request headers carrying a fresh nonce + CSP (Next reads the nonce from the
 * request's CSP header and applies it to its own scripts; the layout reads
 * x-nonce for next-themes), and the policy for the response.
 */
function withCsp(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp(nonce, new URL(process.env.AUTH_URL ?? "https://auth.aboutselphy.com").origin);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set(CSP_HEADER, csp);
  return { headers, csp };
}

const RESERVED_HOSTS = new Set(["localhost", "127.0.0.1"]);

// Static, code-only subdomain pages -- rewritten (not redirected, so the
// browser's URL bar keeps showing the subdomain) straight to a route in
// this app, entirely bypassing the dashboard-driven SocialLink/Redis
// lookup below. Not a "real" forward: no DB row, no dashboard UI for it.
// Also listed in RESERVED_SUBDOMAINS so a dashboard-created link can never
// claim the same slug.
const STATIC_SUBDOMAIN_PAGES: Record<string, string> = {
  onlyfans: "/onlyfans",
};

function extractLabel(hostname: string): string | null {
  if (RESERVED_HOSTS.has(hostname)) {
    return null;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (
    rootDomain &&
    (hostname === rootDomain ||
      hostname === `www.${rootDomain}` ||
      hostname === `social.${rootDomain}`)
  ) {
    return null;
  }

  return hostname.split(".")[0] || null;
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const label = extractLabel(hostname);

  const staticPage = label ? STATIC_SUBDOMAIN_PAGES[label] : undefined;
  if (staticPage) {
    const { headers, csp } = withCsp(request);
    const response = NextResponse.rewrite(new URL(staticPage, request.url), { request: { headers } });
    response.headers.set(CSP_HEADER, csp);
    return response;
  }

  const subdomain = label && !RESERVED_SUBDOMAINS.has(label) ? label : null;

  if (subdomain) {
    const target = await resolveSubdomain(subdomain);
    if (target) {
      return NextResponse.redirect(target, 307);
    }
    // Unconfigured subdomain -- send visitors back to the main site rather
    // than a bare 404, since a stale/mistyped forward is more likely than a
    // deliberate probe.
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL("/", request.url)
    );
  }

  // Return URLs are built from NEXT_PUBLIC_SITE_URL rather than request.url,
  // which is the container's internal address behind Traefik.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.url;

  // Old /sign-in bookmarks: a real 307 here, since the page-level redirect()
  // in src/app/sign-in/page.tsx only runs after the root loading.tsx has
  // started streaming (it degrades to a meta refresh there).
  if (request.nextUrl.pathname === "/sign-in") {
    return NextResponse.redirect(loginUrl(new URL("/dashboard", siteUrl).toString()));
  }

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const session = await getStaffSession(request.cookies);
    if (!session || !canAccessDashboard(session.user.role)) {
      const returnTo = new URL(request.nextUrl.pathname + request.nextUrl.search, siteUrl);
      return NextResponse.redirect(loginUrl(returnTo.toString()));
    }
  }

  const { headers, csp } = withCsp(request);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set(CSP_HEADER, csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
