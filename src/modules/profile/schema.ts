import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Required").max(100),
  bio: z.string().trim().max(2000).optional(),
  avatarUrl: z.union([z.url(), z.literal("")]).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
