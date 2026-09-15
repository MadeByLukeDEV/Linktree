import { prisma } from "@/lib/prisma";
import type { SocialLink, LinkGroup } from "@/generated/prisma/client";

export type SocialLinkWriteInput = {
  platform: string;
  label: string;
  url: string;
  icon: string | null;
  showOnProfile: boolean;
  subdomain: string | null;
  groupId: string | null;
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

export function findByGroup(groupId: string): Promise<SocialLink[]> {
  return prisma.socialLink.findMany({
    where: { groupId },
    orderBy: { order: "asc" },
  });
}

// Order is scoped per bucket (a group, or the ungrouped bucket when
// groupId is null) rather than one global sequence -- see the schema.prisma
// comment on LinkGroup.
export async function nextOrder(groupId: string | null): Promise<number> {
  const last = await prisma.socialLink.findFirst({
    where: { groupId },
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

export function setOrder(id: string, order: number): Promise<SocialLink> {
  return prisma.socialLink.update({ where: { id }, data: { order } });
}

export function remove(id: string): Promise<SocialLink> {
  return prisma.socialLink.delete({ where: { id } });
}

// `order` is always the full ordered id list for exactly one bucket (one
// group, or the ungrouped bucket) -- links never drag between buckets, so
// this never needs to touch groupId.
export function reorder(order: string[]): Promise<unknown> {
  return prisma.$transaction(
    order.map((id, index) =>
      prisma.socialLink.update({ where: { id }, data: { order: index } })
    )
  );
}

export function findAllGroups(): Promise<LinkGroup[]> {
  return prisma.linkGroup.findMany({ orderBy: { order: "asc" } });
}

export function findGroupById(id: string): Promise<LinkGroup | null> {
  return prisma.linkGroup.findUnique({ where: { id } });
}

export async function nextGroupOrder(): Promise<number> {
  const last = await prisma.linkGroup.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export function createGroup(label: string, order: number): Promise<LinkGroup> {
  return prisma.linkGroup.create({ data: { label, order } });
}

export function updateGroup(id: string, label: string): Promise<LinkGroup> {
  return prisma.linkGroup.update({ where: { id }, data: { label } });
}

// Links in this group fall back to the ungrouped bucket via the schema's
// onDelete: SetNull -- they are never deleted along with their group.
export function removeGroup(id: string): Promise<LinkGroup> {
  return prisma.linkGroup.delete({ where: { id } });
}

export function reorderGroups(order: string[]): Promise<unknown> {
  return prisma.$transaction(
    order.map((id, index) =>
      prisma.linkGroup.update({ where: { id }, data: { order: index } })
    )
  );
}
