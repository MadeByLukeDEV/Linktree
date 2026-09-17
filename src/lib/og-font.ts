// next/og's ImageResponse (Satori under the hood) has no access to
// next/font -- fonts must be passed in as raw bytes. This fetches the
// actual Plus Jakarta Sans files from Google Fonts' CSS2 API at request
// time so generated OG images use the site's real font instead of a
// generic fallback. `text` narrows the CSS2 request to only the glyphs
// actually needed (Google's API subsets the font file accordingly),
// keeping the fetch small.
export async function loadPlusJakartaSans(
  text: string,
  weight: 400 | 500 | 600 | 700 | 800 = 700
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) {
    throw new Error("Could not find a font source in the Google Fonts CSS response");
  }
  const fontResponse = await fetch(match[1]);
  return fontResponse.arrayBuffer();
}
