"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/server";
import {
  socialLinkSchema,
  linkGroupSchema,
} from "@/modules/social-links/schema";
import * as service from "@/modules/social-links/service";
import type { SocialLink, LinkGroup } from "@/generated/prisma/client";
import { canAccessDashboard } from "@/modules/auth/roles";

// Both roles (owner + moderator) can manage links and groups.
async function requireDashboardAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canAccessDashboard(session.user.role)) {
    throw new Error("Not authorized");
  }
}

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type SocialLinkActionResult =
  | { success: true; data: SocialLink }
  | { success: false; error: string };

export type LinkGroupActionResult =
  | { success: true; data: LinkGroup }
  | { success: false; error: string };

export async function createSocialLinkAction(
  input: unknown
): Promise<SocialLinkActionResult> {
  await requireDashboardAccess();
  const parsed = socialLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let data: SocialLink;
  try {
    data = await service.createLink(parsed.data);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidatePath("/");
  return { success: true, data };
}

export async function updateSocialLinkAction(
  id: string,
  input: unknown
): Promise<SocialLinkActionResult> {
  await requireDashboardAccess();
  const parsed = socialLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let data: SocialLink;
  try {
    data = await service.updateLink(id, parsed.data);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidatePath("/");
  return { success: true, data };
}

export async function deleteSocialLinkAction(id: string): Promise<ActionResult> {
  await requireDashboardAccess();

  try {
    await service.deleteLink(id);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function reorderSocialLinksAction(
  orderedIds: string[]
): Promise<ActionResult> {
  await requireDashboardAccess();

  try {
    await service.reorderLinks(orderedIds);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function createLinkGroupAction(
  input: unknown
): Promise<LinkGroupActionResult> {
  await requireDashboardAccess();
  const parsed = linkGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = await service.createGroup(parsed.data);
  revalidatePath("/");
  return { success: true, data };
}

export async function updateLinkGroupAction(
  id: string,
  input: unknown
): Promise<LinkGroupActionResult> {
  await requireDashboardAccess();
  const parsed = linkGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let data: LinkGroup;
  try {
    data = await service.updateGroup(id, parsed.data);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidatePath("/");
  return { success: true, data };
}

export async function deleteLinkGroupAction(id: string): Promise<ActionResult> {
  await requireDashboardAccess();
  await service.deleteGroup(id);
  revalidatePath("/");
  return { success: true };
}

export async function reorderLinkGroupsAction(
  orderedIds: string[]
): Promise<ActionResult> {
  await requireDashboardAccess();
  await service.reorderGroups(orderedIds);
  revalidatePath("/");
  return { success: true };
}
