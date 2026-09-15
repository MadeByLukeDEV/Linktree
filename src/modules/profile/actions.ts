"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/server";
import { profileSchema } from "@/modules/profile/schema";
import * as service from "@/modules/profile/service";
import { isAdmin } from "@/modules/auth/roles";

type ActionResult = { success: true } | { success: false; error: string };

// Owner-only: the public display name/bio/avatar, unlike Links, isn't
// something moderators can change.
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session.user.role)) {
    throw new Error("Not authorized");
  }
}

export async function saveProfileAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await service.saveProfile(parsed.data);

  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}
