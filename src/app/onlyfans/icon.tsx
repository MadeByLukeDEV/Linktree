import { ImageResponse } from "next/og";

// Per-route favicon (Next's file convention) so the /onlyfans tab shows a
// small blue/lock icon matching its own OnlyFans-style branding instead of
// the main site's favicon. Fully static -- no DB reads, no external font
// fetch -- so it's prerendered once at build time.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#00aff0",
          borderRadius: 8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="11" width="16" height="9" rx="2" stroke="white" strokeWidth="2.5" />
          <path
            d="M8 11V7a4 4 0 0 1 8 0v4"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
