"use server";

import { headers } from "next/headers";
import { auth } from "@/modules/auth/server";
import { isAdmin } from "@/modules/auth/roles";
import * as service from "@/modules/twitch/service";

// Admin-only: this reflects live Dokploy config/infra state, not something
// a moderator would act on (they can't set env vars or run the
// registration script either way).
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session.user.role)) {
    throw new Error("Not authorized");
  }
}

export type TwitchDiagnostics = {
  env: service.TwitchEnvStatus;
  live: boolean;
  eventSub: service.EventSubDiagnostics;
};

export async function checkTwitchStatusAction(): Promise<TwitchDiagnostics> {
  await requireAdmin();

  const [live, eventSub] = await Promise.all([
    service.isLive(),
    service.checkEventSubStatus(),
  ]);

  return { env: service.getEnvStatus(), live, eventSub };
}
