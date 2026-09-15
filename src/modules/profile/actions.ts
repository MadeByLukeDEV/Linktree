"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/server";
import { profileSchema } from "@/modules/profile/schema";
import * as service from "@/modules/profile/service";

type ActionResult = { success: true } | { success: false; error: string };

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Not authenticated");
  }
}

export async function saveProfileAction(input: unknown): Promise<ActionResult> {
  await requireSession();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await service.saveProfile(parsed.data);

  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}
