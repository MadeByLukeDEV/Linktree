import { prisma } from "@/lib/prisma";
import type { SocialLink } from "@/generated/prisma/client";

export type SocialLinkWriteInput = {
  platform: string;
  label: string;
  url: string;
  icon: string | null;
  showOnProfile: boolean;
  subdomain: string | null;
};

export function findAll(): Promise<SocialLink[]> {
  return prisma.socialLink.findMany({ orderBy: { order: "asc" } });
}

export function findVisible(): Promise<SocialLink[]> {
  return prisma.socialLink.findMany({
    where: { showOnProfile: true },
    orderBy: { order: "asc" },
  });
}

export function findBySubdomain(subdomain: string): Promise<SocialLink | null> {
  return prisma.socialLink.findUnique({ where: { subdomain } });
}

export function findById(id: string): Promise<SocialLink | null> {
  return prisma.socialLink.findUnique({ where: { id } });
}

export async function nextOrder(): Promise<number> {
  const last = await prisma.socialLink.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export function create(
  data: SocialLinkWriteInput & { order: number }
): Promise<SocialLink> {
  return prisma.socialLink.create({ data });
}

export function update(
  id: string,
  data: SocialLinkWriteInput
): Promise<SocialLink> {
  return prisma.socialLink.update({ where: { id }, data });
}

export function remove(id: string): Promise<SocialLink> {
  return prisma.socialLink.delete({ where: { id } });
}

export function reorder(order: string[]): Promise<unknown> {
  return prisma.$transaction(
    order.map((id, index) =>
      prisma.socialLink.update({ where: { id }, data: { order: index } })
    )
  );
}
