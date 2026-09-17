import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/modules/auth/server";
import { resolveSubdomain } from "@/modules/redirects/service";
import { RESERVED_SUBDOMAINS } from "@/lib/reserved-subdomains";
import { canAccessDashboard } from "@/modules/auth/roles";

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
    return NextResponse.rewrite(new URL(staticPage, request.url));
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

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !canAccessDashboard(session.user.role)) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
