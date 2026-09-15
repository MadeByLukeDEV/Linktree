import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/modules/auth/server";
import { resolveSubdomain } from "@/modules/redirects/service";
import { RESERVED_SUBDOMAINS } from "@/lib/reserved-subdomains";

const RESERVED_HOSTS = new Set(["localhost", "127.0.0.1"]);

function extractForwardSubdomain(hostname: string): string | null {
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

  const label = hostname.split(".")[0];
  if (!label || RESERVED_SUBDOMAINS.has(label)) {
    return null;
  }
  return label;
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const subdomain = extractForwardSubdomain(hostname);

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
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
