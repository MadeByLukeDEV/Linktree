"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { SocialLink, LinkGroup } from "@/generated/prisma/client";
import { BrandIcon } from "@/modules/social-links/components/brand-icon";
import { TwitchLiveBadge } from "@/modules/twitch/components/twitch-live-badge";

// Hover/tap feedback is a variant, not inline whileHover props, so the icon
// and label can each declare their own reaction to the same "hover"/"tap"
// state (propagated down from the <motion.a>) instead of everything moving
// in lockstep. No dnd-kit on this list (unlike the dashboard's draggable
// LinkList), so continuously-active transform props are safe here -- see
// the dnd-kit/Framer Motion note in CLAUDE.md for why the dashboard list
// deliberately avoids the same treatment.
const rowVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 0 0 0 rgba(0, 255, 168, 0)",
  },
  hover: {
    scale: 1.02,
    y: "-0.15rem",
    boxShadow: "0 0.75rem 1.5rem -0.75rem rgba(0, 255, 168, 0.45)",
  },
  tap: { scale: 0.97, y: 0 },
};

const iconVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: -8, scale: 1.12 },
  tap: { rotate: 0, scale: 1 },
};

const labelVariants = {
  rest: { x: 0 },
  hover: { x: "0.2rem" },
  tap: { x: 0 },
};

const springTransition = { type: "spring" as const, stiffness: 400, damping: 22 };

function LinkRow({
  link,
  index,
  twitchLive,
}: {
  link: SocialLink;
  index: number;
  twitchLive: boolean;
}) {
  const isTwitchLive =
    twitchLive && link.platform.trim().toLowerCase() === "twitch";

  return (
    <motion.li
      initial={{ opacity: 0, y: "0.5rem" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <motion.a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        variants={rowVariants}
        transition={springTransition}
        className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-[clamp(0.75rem,3vw,1rem)] transition-colors hover:bg-muted"
      >
        <motion.div
          variants={iconVariants}
          transition={springTransition}
          className="relative shrink-0"
        >
          <BrandIcon
            platform={link.platform}
            url={link.url}
            iconUrl={link.icon}
            className="size-[clamp(2rem,7vw,2.5rem)]"
          />
          {isTwitchLive ? (
            <TwitchLiveBadge className="absolute -top-1 -right-1" />
          ) : null}
        </motion.div>
        <div className="flex min-w-0 flex-col">
          <motion.span
            variants={labelVariants}
            transition={springTransition}
            className="truncate font-medium"
          >
            {link.platform}
          </motion.span>
          <span className="truncate text-sm text-muted-foreground">
            {link.label}
          </span>
        </div>
      </motion.a>
    </motion.li>
  );
}

export function PublicLinkList({
  ungrouped,
  groups,
  twitchLive,
}: {
  ungrouped: SocialLink[];
  groups: (LinkGroup & { links: SocialLink[] })[];
  twitchLive: boolean;
}) {
  const t = useTranslations("PublicProfile");
  const visibleGroups = groups.filter((g) => g.links.length > 0);

  if (ungrouped.length === 0 && visibleGroups.length === 0) {
    return (
      <p className="text-center text-muted-foreground">{t("noLinks")}</p>
    );
  }

  let index = 0;

  return (
    <div className="flex w-full flex-col gap-[clamp(1.25rem,4vw,1.75rem)]">
      {ungrouped.length > 0 ? (
        <ul className="flex w-full flex-col gap-[clamp(0.5rem,2vw,0.75rem)]">
          {ungrouped.map((link) => (
            <LinkRow key={link.id} link={link} index={index++} twitchLive={twitchLive} />
          ))}
        </ul>
      ) : null}

      {visibleGroups.map((group) => (
        <div
          key={group.id}
          className="flex w-full flex-col gap-[clamp(0.5rem,2vw,0.75rem)]"
        >
          <h2 className="px-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </h2>
          <ul className="flex w-full flex-col gap-[clamp(0.5rem,2vw,0.75rem)]">
            {group.links.map((link) => (
              <LinkRow key={link.id} link={link} index={index++} twitchLive={twitchLive} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
