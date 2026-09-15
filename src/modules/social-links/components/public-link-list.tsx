"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link2 } from "lucide-react";
import type { SocialLink } from "@/generated/prisma/client";

export function PublicLinkList({ links }: { links: SocialLink[] }) {
  const t = useTranslations("PublicProfile");

  if (links.length === 0) {
    return (
      <p className="text-center text-muted-foreground">{t("noLinks")}</p>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-[clamp(0.5rem,2vw,0.75rem)]">
      {links.map((link, index) => (
        <motion.li
          key={link.id}
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
            {link.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={link.icon}
                alt=""
                className="size-[clamp(1.5rem,5vw,2rem)] shrink-0 rounded-full object-cover"
              />
            ) : (
              <Link2 className="size-[clamp(1.25rem,4vw,1.5rem)] shrink-0 text-muted-foreground" />
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{link.platform}</span>
              <span className="truncate text-sm text-muted-foreground">
                {link.label}
              </span>
            </div>
          </a>
        </motion.li>
      ))}
    </ul>
  );
}
