import { Link2 } from "lucide-react";
import { resolveBrandIcon } from "@/modules/social-links/lib/brand-icon";
import { cn } from "@/lib/utils";

export function BrandIcon({
  platform,
  url,
  iconUrl,
  className,
}: {
  platform: string;
  url?: string;
  iconUrl?: string | null;
  className?: string;
}) {
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  const icon = resolveBrandIcon(platform, url);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted",
        className
      )}
    >
      {icon ? (
        <svg
          viewBox="0 0 24 24"
          className="size-[65%]"
          fill={`#${icon.hex}`}
          role="img"
          aria-label={icon.title}
        >
          <path d={icon.path} />
        </svg>
      ) : (
        <Link2 className="size-[55%] text-muted-foreground" />
      )}
    </span>
  );
}
