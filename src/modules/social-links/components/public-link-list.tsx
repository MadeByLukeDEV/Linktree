"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { SocialLink, LinkGroup } from "@/generated/prisma/client";
import { BrandIcon } from "@/modules/social-links/components/brand-icon";

function LinkRow({ link, index }: { link: SocialLink; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: "0.5rem" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-[clamp(0.75rem,3vw,1rem)] transition-colors hover:bg-muted"
      >
        <BrandIcon
          platform={link.platform}
          url={link.url}
          iconUrl={link.icon}
          className="size-[clamp(2rem,7vw,2.5rem)]"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{link.platform}</span>
          <span className="truncate text-sm text-muted-foreground">
            {link.label}
          </span>
        </div>
      </a>
    </motion.li>
  );
}

export function PublicLinkList({
  ungrouped,
  groups,
}: {
  ungrouped: SocialLink[];
  groups: (LinkGroup & { links: SocialLink[] })[];
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
            <LinkRow key={link.id} link={link} index={index++} />
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
              <LinkRow key={link.id} link={link} index={index++} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
