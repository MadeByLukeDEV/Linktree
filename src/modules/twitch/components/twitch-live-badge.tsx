"use client";

import { motion } from "framer-motion";
import { cn } from "cn";

// Purely presentational -- the caller decides whether the broadcaster is
// actually live (src/modules/twitch/service.ts's isLive(), read server-side
// and threaded down as a prop) and only renders this when true. Red rather
// than the site's brand teal deliberately, since "red pulsing dot" is the
// near-universal signal for "broadcasting live" and needs to read instantly
// at a glance.
export function TwitchLiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-3.5 items-center justify-center rounded-full bg-background ring-1 ring-background",
        className
      )}
      title="Live on Twitch"
    >
      <motion.span
        className="size-2.5 rounded-full bg-red-500"
        animate={{ scale: [1, 1.35, 1], opacity: [1, 0.65, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="sr-only">Live on Twitch</span>
    </span>
  );
}
