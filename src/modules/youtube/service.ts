import { redis } from "@/lib/redis";

const CACHE_KEY = "youtube:latest";
const CACHE_TTL_SECONDS = 3600;
// YouTube doesn't expose an "is this a Short" flag via the API; duration is
// the standard heuristic (Shorts are currently capped at 3 minutes).
const SHORT_MAX_DURATION_SECONDS = 180;

export type YoutubeVideo = {
  id: string;
  title: string;
  thumbnailUrl: string;
};

export type YoutubeLatest = {
  video: YoutubeVideo | null;
  short: YoutubeVideo | null;
};

const EMPTY_LATEST: YoutubeLatest = { video: null, short: null };

type YoutubeThumbnails = {
  default?: { url: string };
  high?: { url: string };
};

type ChannelsListResponse = {
  items?: Array<{
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
};

type PlaylistItemsResponse = {
  items?: Array<{
    snippet: { title: string; thumbnails?: YoutubeThumbnails };
    contentDetails: { videoId: string };
  }>;
};

type VideosListResponse = {
  items?: Array<{
    id: string;
    contentDetails: { duration: string };
  }>;
};

function parseIsoDurationToSeconds(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export function isYoutubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function fetchFromApi(): Promise<YoutubeLatest> {
  const apiKey = process.env.YOUTUBE_API_KEY!;
  const channelId = process.env.YOUTUBE_CHANNEL_ID!;
  const base = "https://www.googleapis.com/youtube/v3";

  const channelData = await fetchJson<ChannelsListResponse>(
    `${base}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    return EMPTY_LATEST;
  }

  const playlistData = await fetchJson<PlaylistItemsResponse>(
    `${base}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=15&key=${apiKey}`
  );
  const items = playlistData.items ?? [];
  if (items.length === 0) {
    return EMPTY_LATEST;
  }

  const videoIds = items.map((item) => item.contentDetails.videoId).join(",");
  const videosData = await fetchJson<VideosListResponse>(
    `${base}/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
  );
  const durationById = new Map<string, number>(
    (videosData.items ?? []).map((v) => [
      v.id,
      parseIsoDurationToSeconds(v.contentDetails.duration),
    ])
  );

  let video: YoutubeVideo | null = null;
  let short: YoutubeVideo | null = null;

  for (const item of items) {
    if (video && short) break;

    const id = item.contentDetails.videoId;
    const duration = durationById.get(id) ?? 0;
    const candidate: YoutubeVideo = {
      id,
      title: item.snippet.title,
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.default?.url ??
        "",
    };

    if (duration > 0 && duration <= SHORT_MAX_DURATION_SECONDS && !short) {
      short = candidate;
    } else if (duration > SHORT_MAX_DURATION_SECONDS && !video) {
      video = candidate;
    }
  }

  return { video, short };
}

export async function getLatest(): Promise<YoutubeLatest> {
  if (!isYoutubeConfigured()) {
    return EMPTY_LATEST;
  }

  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as YoutubeLatest;
    }
  } catch (error) {
    console.error("YouTube cache lookup failed, fetching fresh:", error);
  }

  let latest: YoutubeLatest;
  try {
    latest = await fetchFromApi();
  } catch (error) {
    console.error("YouTube API fetch failed:", error);
    return EMPTY_LATEST;
  }

  try {
    await redis.set(CACHE_KEY, JSON.stringify(latest), "EX", CACHE_TTL_SECONDS);
  } catch (error) {
    console.error("Failed to cache YouTube data:", error);
  }

  return latest;
}
