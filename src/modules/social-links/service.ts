import * as repository from "@/modules/social-links/repository";
import { invalidateRedirectCache } from "@/lib/redirect-cache";
import type {
  SocialLinkInput,
  LinkGroupInput,
} from "@/modules/social-links/schema";
import type { SocialLink, LinkGroup } from "@/generated/prisma/client";

export class SubdomainTakenError extends Error {
  constructor(subdomain: string) {
    super(`Subdomain "${subdomain}" is already in use`);
    this.name = "SubdomainTakenError";
  }
}

export type GroupedLinks = {
  ungrouped: SocialLink[];
  groups: (LinkGroup & { links: SocialLink[] })[];
};

function normalize(input: SocialLinkInput): repository.SocialLinkWriteInput {
  return {
    platform: input.platform,
    label: input.label,
    url: input.url,
    icon: input.icon || null,
    showOnProfile: input.showOnProfile,
    subdomain: input.subdomain || null,
    groupId: input.groupId || null,
  };
}

async function assertSubdomainAvailable(subdomain: string, excludeId?: string) {
  const existing = await repository.findBySubdomain(subdomain);
  if (existing && existing.id !== excludeId) {
    throw new SubdomainTakenError(subdomain);
  }
}

function groupLinks(links: SocialLink[], groups: LinkGroup[]): GroupedLinks {
  const byGroup = new Map<string, SocialLink[]>();
  const ungrouped: SocialLink[] = [];

  for (const link of links) {
    if (!link.groupId) {
      ungrouped.push(link);
      continue;
    }
    const bucket = byGroup.get(link.groupId);
    if (bucket) {
      bucket.push(link);
    } else {
      byGroup.set(link.groupId, [link]);
    }
  }

  return {
    ungrouped,
    groups: groups.map((group) => ({
      ...group,
      links: byGroup.get(group.id) ?? [],
    })),
  };
}

export const getBySubdomain = repository.findBySubdomain;

export async function listGroupedAll(): Promise<GroupedLinks> {
  const [links, groups] = await Promise.all([
    repository.findAll(),
    repository.findAllGroups(),
  ]);
  return groupLinks(links, groups);
}

export async function listGroupedVisible(): Promise<GroupedLinks> {
  const [links, groups] = await Promise.all([
    repository.findVisible(),
    repository.findAllGroups(),
  ]);
  return groupLinks(links, groups);
}

export async function createLink(input: SocialLinkInput) {
  const data = normalize(input);
  if (data.subdomain) {
    await assertSubdomainAvailable(data.subdomain);
  }
  if (data.groupId && !(await repository.findGroupById(data.groupId))) {
    throw new Error("Group not found");
  }
  const order = await repository.nextOrder(data.groupId);
  return repository.create({ ...data, order });
}

export async function updateLink(id: string, input: SocialLinkInput) {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error("Social link not found");
  }

  const data = normalize(input);
  if (data.subdomain) {
    await assertSubdomainAvailable(data.subdomain, id);
  }
  if (data.groupId && !(await repository.findGroupById(data.groupId))) {
    throw new Error("Group not found");
  }

  let updated = await repository.update(id, data);

  // Moving a link into a different bucket (group change) puts it at the end
  // of its new bucket -- its old `order` value has no meaning there.
  if (data.groupId !== existing.groupId) {
    const order = await repository.nextOrder(data.groupId);
    updated = await repository.setOrder(id, order);
  }

  // Invalidate the old subdomain's cache entry whenever it existed, not just
  // when the subdomain value itself changed -- other fields (e.g. url) can
  // change while the subdomain stays the same, and a stale cached target
  // must not keep serving until the TTL expires.
  if (existing.subdomain) {
    await invalidateRedirectCache(existing.subdomain);
  }
  if (data.subdomain && data.subdomain !== existing.subdomain) {
    await invalidateRedirectCache(data.subdomain);
  }

  return updated;
}

export async function deleteLink(id: string) {
  const existing = await repository.findById(id);
  if (!existing) {
    return;
  }
  await repository.remove(id);
  if (existing.subdomain) {
    await invalidateRedirectCache(existing.subdomain);
  }
}

export const reorderLinks = repository.reorder;

export async function createGroup(input: LinkGroupInput) {
  const order = await repository.nextGroupOrder();
  return repository.createGroup(input.label, order);
}

export async function updateGroup(id: string, input: LinkGroupInput) {
  const existing = await repository.findGroupById(id);
  if (!existing) {
    throw new Error("Group not found");
  }
  return repository.updateGroup(id, input.label);
}

export async function deleteGroup(id: string) {
  const existing = await repository.findGroupById(id);
  if (!existing) {
    return;
  }

  // The group's links fall back to the ungrouped bucket (schema's
  // onDelete: SetNull) -- give them fresh sequential order values there
  // first so they don't collide with whatever's already in that bucket.
  const orphaned = await repository.findByGroup(id);
  let order = await repository.nextOrder(null);
  for (const link of orphaned) {
    await repository.setOrder(link.id, order++);
  }

  await repository.removeGroup(id);
}

export const reorderGroups = repository.reorderGroups;
