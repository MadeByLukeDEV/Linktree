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
//
// Every branch below logs to console deliberately -- this route previously
// logged nothing at all on success, so there was no way to tell from
// Dokploy's logs whether Twitch was even reaching it. See the dashboard's
// admin-only Twitch tab (src/modules/twitch/components/twitch-status.tsx)
// for the other half of diagnosing this: it queries Twitch directly for
// the actual subscription status, since a missing/failed subscription
// wouldn't produce any log lines here at all.
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
    console.warn(
      "Twitch webhook: rejected a request with an invalid/missing signature",
      { messageType, hasSignature: Boolean(signature) }
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);

  if (messageType === "webhook_callback_verification") {
    console.log(
      `Twitch webhook: verification challenge received for subscription type "${body.subscription?.type}" -- responding with the challenge to complete registration.`
    );
    // Twitch expects the raw challenge string back, not JSON.
    return new NextResponse(body.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (messageType === "notification") {
    const eventType = body.subscription?.type;
    console.log(`Twitch webhook: notification received: ${eventType}`);
    if (eventType === "stream.online") {
      await service.setLive(true);
    } else if (eventType === "stream.offline") {
      await service.setLive(false);
    } else {
      console.warn(`Twitch webhook: unhandled notification type: ${eventType}`);
    }
    return new NextResponse(null, { status: 204 });
  }

  if (messageType === "revocation") {
    // Twitch includes why in the subscription's status field, e.g.
    // "authorization_revoked", "user_removed", "notification_failures_exceeded".
    console.warn(
      `Twitch webhook: subscription revoked -- type "${body.subscription?.type}", reason: ${body.subscription?.status}`
    );
    return new NextResponse(null, { status: 204 });
  }

  console.warn(`Twitch webhook: received unrecognized message type: ${messageType}`);
  return new NextResponse(null, { status: 204 });
}
