import * as repository from "@/modules/social-links/repository";
import { invalidateRedirectCache } from "@/lib/redirect-cache";
import type { SocialLinkInput } from "@/modules/social-links/schema";

export class SubdomainTakenError extends Error {
  constructor(subdomain: string) {
    super(`Subdomain "${subdomain}" is already in use`);
    this.name = "SubdomainTakenError";
  }
}

function normalize(input: SocialLinkInput): repository.SocialLinkWriteInput {
  return {
    platform: input.platform,
    label: input.label,
    url: input.url,
    icon: input.icon || null,
    showOnProfile: input.showOnProfile,
    subdomain: input.subdomain || null,
  };
}

async function assertSubdomainAvailable(subdomain: string, excludeId?: string) {
  const existing = await repository.findBySubdomain(subdomain);
  if (existing && existing.id !== excludeId) {
    throw new SubdomainTakenError(subdomain);
  }
}

export const listAll = repository.findAll;
export const listVisible = repository.findVisible;

export async function createLink(input: SocialLinkInput) {
  const data = normalize(input);
  if (data.subdomain) {
    await assertSubdomainAvailable(data.subdomain);
  }
  const order = await repository.nextOrder();
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

  const updated = await repository.update(id, data);

  if (existing.subdomain && existing.subdomain !== data.subdomain) {
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
