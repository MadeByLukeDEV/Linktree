import {
  siInstagram,
  siTiktok,
  siYoutube,
  siX,
  siFacebook,
  siTwitch,
  siDiscord,
  siSnapchat,
  siPinterest,
  siReddit,
  siThreads,
  siSpotify,
  siApplemusic,
  siSoundcloud,
  siGithub,
  siPatreon,
  siOnlyfans,
  siKick,
  siBluesky,
  siMastodon,
  siTelegram,
  siWhatsapp,
  siCashapp,
  siVenmo,
  siPaypal,
  siGmail,
  siLinktree,
  type SimpleIcon,
} from "simple-icons";

// Curated on purpose rather than resolving from the full ~3000-icon set --
// keeps the bundle small and avoids pulling in icons nobody here will use.
// Platform names are matched case-insensitively after trimming; add an
// entry here (name -> icon, and matching domain(s) below) to support more.
const PLATFORM_ICONS: Record<string, SimpleIcon> = {
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  twitter: siX,
  x: siX,
  facebook: siFacebook,
  twitch: siTwitch,
  discord: siDiscord,
  snapchat: siSnapchat,
  pinterest: siPinterest,
  reddit: siReddit,
  threads: siThreads,
  spotify: siSpotify,
  "apple music": siApplemusic,
  soundcloud: siSoundcloud,
  github: siGithub,
  patreon: siPatreon,
  onlyfans: siOnlyfans,
  kick: siKick,
  bluesky: siBluesky,
  mastodon: siMastodon,
  telegram: siTelegram,
  whatsapp: siWhatsapp,
  "cash app": siCashapp,
  venmo: siVenmo,
  paypal: siPaypal,
  email: siGmail,
  gmail: siGmail,
  linktree: siLinktree,
};

const DOMAIN_ICONS: Record<string, SimpleIcon> = {
  "instagram.com": siInstagram,
  "tiktok.com": siTiktok,
  "youtube.com": siYoutube,
  "youtu.be": siYoutube,
  "twitter.com": siX,
  "x.com": siX,
  "facebook.com": siFacebook,
  "fb.com": siFacebook,
  "twitch.tv": siTwitch,
  "discord.gg": siDiscord,
  "discord.com": siDiscord,
  "snapchat.com": siSnapchat,
  "pinterest.com": siPinterest,
  "reddit.com": siReddit,
  "threads.net": siThreads,
  "open.spotify.com": siSpotify,
  "spotify.com": siSpotify,
  "music.apple.com": siApplemusic,
  "soundcloud.com": siSoundcloud,
  "github.com": siGithub,
  "patreon.com": siPatreon,
  "onlyfans.com": siOnlyfans,
  "kick.com": siKick,
  "bsky.app": siBluesky,
  "mastodon.social": siMastodon,
  "t.me": siTelegram,
  "telegram.org": siTelegram,
  "wa.me": siWhatsapp,
  "cash.app": siCashapp,
  "venmo.com": siVenmo,
  "paypal.com": siPaypal,
  "paypal.me": siPaypal,
  "linktr.ee": siLinktree,
};

export function resolveBrandIcon(
  platform: string,
  url?: string
): SimpleIcon | null {
  const normalizedPlatform = platform.trim().toLowerCase();
  if (normalizedPlatform in PLATFORM_ICONS) {
    return PLATFORM_ICONS[normalizedPlatform]!;
  }

  if (url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      if (hostname in DOMAIN_ICONS) {
        return DOMAIN_ICONS[hostname]!;
      }
    } catch {
      // Invalid URL -- fall through to null.
    }
  }

  return null;
}
