import { prisma } from "@/lib/prisma";
import type { Profile } from "@/generated/prisma/client";

export type ProfileWriteInput = {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
};

export function find(): Promise<Profile | null> {
  return prisma.profile.findFirst();
}

export async function upsert(data: ProfileWriteInput): Promise<Profile> {
  const existing = await prisma.profile.findFirst({ select: { id: true } });
  if (existing) {
    return prisma.profile.update({ where: { id: existing.id }, data });
  }
  return prisma.profile.create({ data });
}
