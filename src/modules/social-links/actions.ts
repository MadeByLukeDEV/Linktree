"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/server";
import { socialLinkSchema } from "@/modules/social-links/schema";
import * as service from "@/modules/social-links/service";
import type { SocialLink } from "@/generated/prisma/client";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Not authenticated");
  }
}

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type SocialLinkActionResult =
  | { success: true; data: SocialLink }
  | { success: false; error: string };

export async function createSocialLinkAction(
  input: unknown
): Promise<SocialLinkActionResult> {
  await requireSession();
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
  await requireSession();
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
  await requireSession();

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
  await requireSession();

  try {
    await service.reorderLinks(orderedIds);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  revalidatePath("/");
  return { success: true };
}
