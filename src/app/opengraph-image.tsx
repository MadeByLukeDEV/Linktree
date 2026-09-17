import { ImageResponse } from "next/og";
import * as profileService from "@/modules/profile/service";
import { loadPlusJakartaSans } from "@/lib/og-font";

export const alt = "AboutSelphy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Reads live profile data, same reasoning as src/app/page.tsx: avoid
// Next's build-time static-generation probe attempting this without
// DATABASE_URL available during a Docker build.
export const dynamic = "force-dynamic";

async function isImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

export default async function Image() {
  const profile = await profileService.getProfile();
  const displayName = profile?.displayName || "AboutSelphy";
  const bio =
    profile?.bio?.slice(0, 140) || "Find me everywhere, all in one place.";

  const avatarOk = profile?.avatarUrl
    ? await isImageReachable(profile.avatarUrl)
    : false;

  const fontData = await loadPlusJakartaSans(
    `${displayName}${bio}social.aboutselphy.com`
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(0,255,168,0.35), transparent 45%), radial-gradient(circle at 85% 85%, rgba(0,255,168,0.25), transparent 45%)",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        {avatarOk ? (
          // next/image doesn't work inside Satori's ImageResponse JSX --
          // only a plain <img> renders here, this isn't a real DOM.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile!.avatarUrl!}
            alt=""
            width={160}
            height={160}
            style={{
              borderRadius: 9999,
              objectFit: "cover",
              boxShadow: "0 0 0 6px #ffffff, 0 0 0 10px #00ffa8",
              marginBottom: 32,
            }}
          />
        ) : (
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 9999,
              backgroundColor: "#0a0a0a",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
              marginBottom: 32,
              boxShadow: "0 0 0 6px #ffffff, 0 0 0 10px #00ffa8",
            }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#0a0a0a" }}>
          {displayName}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#525252",
            marginTop: 16,
            maxWidth: 860,
            textAlign: "center",
          }}
        >
          {bio}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 26,
            fontWeight: 700,
            color: "#00875f",
          }}
        >
          social.aboutselphy.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plus Jakarta Sans", data: fontData, weight: 700, style: "normal" },
      ],
      // The bio is owner-authored dashboard content and could contain
      // emoji Plus Jakarta Sans has no glyph for -- unlike the onlyfans OG
      // image (all hardcoded content, drawn as SVG instead), there's no
      // way to know the bio's characters ahead of time, so this renders
      // any emoji as images via Twemoji instead of relying on font glyphs.
      emoji: "twemoji",
    }
  );
}
