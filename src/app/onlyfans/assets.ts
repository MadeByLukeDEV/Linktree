import { existsSync } from "node:fs";
import path from "node:path";

const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// Drop a matching file into public/onlyfans/ (or public/onlyfans/posts/ for
// numbered posts) with any of the extensions above and it's picked up on
// the next request, no code change needed -- same "render a placeholder
// until the real asset shows up" pattern as isYoutubeConfigured()/
// isTwitchConfigured() elsewhere in this app. `baseName` is relative to
// public/onlyfans/, e.g. "banner" or "posts/1".
export function findOnlyFansAsset(baseName: string): string | null {
  for (const ext of EXTENSIONS) {
    const relative = `onlyfans/${baseName}.${ext}`;
    if (existsSync(path.join(process.cwd(), "public", relative))) {
      return `/${relative}`;
    }
  }
  return null;
}
