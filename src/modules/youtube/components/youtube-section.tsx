import { getTranslations } from "next-intl/server";
import { getLatest, type YoutubeVideo } from "@/modules/youtube/service";

function VideoCard({
  video,
  label,
  href,
}: {
  video: YoutubeVideo;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-muted"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="aspect-video w-full object-cover"
      />
      <div className="flex flex-col gap-0.5 p-[clamp(0.5rem,2vw,0.75rem)]">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="line-clamp-2 text-sm font-medium">
          {video.title}
        </span>
      </div>
    </a>
  );
}

export async function YoutubeSection() {
  const [{ video, short }, t] = await Promise.all([
    getLatest(),
    getTranslations("Youtube"),
  ]);

  if (!video && !short) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-[clamp(0.5rem,2vw,0.75rem)] sm:flex-row">
      {video ? (
        <VideoCard
          video={video}
          label={t("latestVideo")}
          href={`https://www.youtube.com/watch?v=${video.id}`}
        />
      ) : null}
      {short ? (
        <VideoCard
          video={short}
          label={t("latestShort")}
          href={`https://www.youtube.com/shorts/${short.id}`}
        />
      ) : null}
    </div>
  );
}
