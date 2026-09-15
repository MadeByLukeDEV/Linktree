import { z } from "zod";
import { RESERVED_SUBDOMAINS } from "@/lib/reserved-subdomains";

export const subdomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    "Lowercase letters, numbers, and hyphens only"
  )
  .max(63)
  .refine((value) => !RESERVED_SUBDOMAINS.has(value), {
    message: "This subdomain is reserved",
  });

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, "Required").max(100),
  label: z.string().trim().min(1, "Required").max(100),
  url: z.url("Enter a valid URL"),
  icon: z.union([z.url(), z.literal("")]).optional(),
  showOnProfile: z.boolean(),
  subdomain: z.union([subdomainSchema, z.literal("")]).optional(),
  groupId: z.union([z.string(), z.literal("")]).optional(),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

export const linkGroupSchema = z.object({
  label: z.string().trim().min(1, "Required").max(100),
});

export type LinkGroupInput = z.infer<typeof linkGroupSchema>;
