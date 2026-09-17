import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const EXTENSIONS = Object.keys(MIME_TYPES);

function findOnlyFansAssetFile(
  baseName: string
): { relative: string; ext: string } | null {
  for (const ext of EXTENSIONS) {
    const relative = `onlyfans/${baseName}.${ext}`;
    if (existsSync(path.join(process.cwd(), "public", relative))) {
      return { relative, ext };
    }
  }
  return null;
}

// Drop a matching file into public/onlyfans/ (or public/onlyfans/posts/ for
// numbered posts) with any of the extensions above and it's picked up on
// the next request, no code change needed -- same "render a placeholder
// until the real asset shows up" pattern as isYoutubeConfigured()/
// isTwitchConfigured() elsewhere in this app. `baseName` is relative to
// public/onlyfans/, e.g. "banner" or "posts/1".
export function findOnlyFansAsset(baseName: string): string | null {
  const found = findOnlyFansAssetFile(baseName);
  return found ? `/${found.relative}` : null;
}

// For contexts with no browser to resolve a relative `/onlyfans/...` URL
// against -- namely the OG image generator (opengraph-image.tsx), which
// runs through Satori and has no notion of "this app's own origin" to
// fetch from. Reads the file directly and inlines it as a data URI.
export function findOnlyFansAssetDataUri(baseName: string): string | null {
  const found = findOnlyFansAssetFile(baseName);
  if (!found) return null;
  const bytes = readFileSync(path.join(process.cwd(), "public", found.relative));
  return `data:${MIME_TYPES[found.ext]};base64,${bytes.toString("base64")}`;
}
