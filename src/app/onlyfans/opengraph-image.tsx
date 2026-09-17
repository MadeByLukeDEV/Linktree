import { ImageResponse } from "next/og";
import { findOnlyFansAssetDataUri } from "./assets";
import { loadPlusJakartaSans } from "@/lib/og-font";

export const alt = "AboutSelphy — definitely a real subscription page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// No emoji/symbol characters here on purpose -- the checkmark badge and
// lock icon below are drawn as inline SVG instead of text glyphs, since
// Plus Jakarta Sans doesn't include glyphs for "✓"/"🔒" and Satori's own
// fallback font fetch for them isn't reliable at build time (this route is
// statically prerendered).
const TEXT = "AboutSelphy@aboutselphySubscribe$4.20/month";

export default async function Image() {
  const avatarUri = findOnlyFansAssetDataUri("avatar");
  const fontData = await loadPlusJakartaSans(TEXT);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 230,
            backgroundImage: "linear-gradient(135deg, #00aff0, #0090c8, #005f8a)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: -95,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 180,
              height: 180,
              borderRadius: 9999,
              border: "8px solid white",
              backgroundColor: "#171717",
              overflow: "hidden",
            }}
          >
            {avatarUri ? (
              // next/image doesn't work inside Satori's ImageResponse JSX
              // -- only a plain <img> renders here, this isn't a real DOM.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUri}
                alt=""
                width={180}
                height={180}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div style={{ display: "flex", color: "white", fontSize: 60, fontWeight: 700 }}>
                AS
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 28 }}>
            <div style={{ display: "flex", fontSize: 54, fontWeight: 700, color: "#171717" }}>
              AboutSelphy
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 9999,
                backgroundColor: "#00aff0",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#737373", marginTop: 8 }}>
            @aboutselphy
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 40,
              backgroundColor: "#00aff0",
              color: "white",
              fontSize: 30,
              fontWeight: 700,
              padding: "18px 52px",
              borderRadius: 9999,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="11" width="16" height="9" rx="2" stroke="white" strokeWidth="2" />
              <path
                d="M8 11V7a4 4 0 0 1 8 0v4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Subscribe — $4.20/month
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plus Jakarta Sans", data: fontData, weight: 700, style: "normal" },
      ],
    }
  );
}
