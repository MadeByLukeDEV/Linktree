import { NextResponse, type NextRequest } from "next/server";
import * as service from "@/modules/twitch/service";

// This route only ever gets real traffic from Twitch's EventSub delivery --
// there is no dashboard or user-facing flow that hits it. Registered once
// via `pnpm register-twitch-webhook` (scripts/register-twitch-webhook.ts)
// against the deployed URL; Twitch calls back here synchronously during
// that registration to prove the endpoint is reachable (the
// webhook_callback_verification branch below), so this must already be
// deployed and publicly reachable before running that script -- it cannot
// be verified against localhost.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const messageType = request.headers.get("twitch-eventsub-message-type");
  const messageId = request.headers.get("twitch-eventsub-message-id");
  const messageTimestamp = request.headers.get(
    "twitch-eventsub-message-timestamp"
  );
  const signature = request.headers.get("twitch-eventsub-message-signature");

  if (
    !service.verifyEventSubSignature(
      rawBody,
      messageId,
      messageTimestamp,
      signature
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);

  if (messageType === "webhook_callback_verification") {
    // Twitch expects the raw challenge string back, not JSON.
    return new NextResponse(body.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (messageType === "notification") {
    const eventType = body.subscription?.type;
    if (eventType === "stream.online") {
      await service.setLive(true);
    } else if (eventType === "stream.offline") {
      await service.setLive(false);
    }
    return new NextResponse(null, { status: 204 });
  }

  // messageType === "revocation", or anything else Twitch might add later --
  // acknowledge so Twitch doesn't keep retrying, there's nothing to act on.
  return new NextResponse(null, { status: 204 });
}
