"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  checkTwitchStatusAction,
  type TwitchDiagnostics,
} from "@/modules/twitch/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function EnvRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="size-4 text-emerald-600" />
      ) : (
        <XCircle className="size-4 text-destructive" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "enabled") return "default";
  if (status.includes("pending")) return "secondary";
  return "destructive";
}

// Fetched purely client-side, on mount, rather than during the dashboard's
// server render -- this hits Twitch's API directly (two real HTTP calls),
// and if Twitch is ever slow or down, that shouldn't block/slow down the
// entire dashboard page load for the admin just because this tab exists.
export function TwitchStatus({ expectedCallbackUrl }: { expectedCallbackUrl: string }) {
  const [diagnostics, setDiagnostics] = useState<TwitchDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load(withToast: boolean) {
    startTransition(async () => {
      const promise = checkTwitchStatusAction();
      if (withToast) {
        toast.promise(promise, {
          loading: "Checking Twitch...",
          success: "Done",
          error: (err) => (err as Error).message,
        });
      }
      try {
        const fresh = await promise;
        setDiagnostics(fresh);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  useEffect(() => load(false), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Twitch webhook status</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => load(true)} disabled={isPending}>
          <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          Recheck
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!diagnostics ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold">Environment variables</h3>
            <EnvRow label="TWITCH_CLIENT_ID" ok={diagnostics.env.clientId} />
            <EnvRow label="TWITCH_CLIENT_SECRET" ok={diagnostics.env.clientSecret} />
            <EnvRow label="TWITCH_BROADCASTER_LOGIN" ok={diagnostics.env.broadcasterLogin} />
            <EnvRow label="TWITCH_WEBHOOK_SECRET" ok={diagnostics.env.webhookSecret} />
            {!(
              diagnostics.env.clientId &&
              diagnostics.env.clientSecret &&
              diagnostics.env.broadcasterLogin &&
              diagnostics.env.webhookSecret
            ) ? (
              <p className="mt-1 text-xs text-muted-foreground">
                All four need to be set in Dokploy for the live badge and
                webhook verification to work at all.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold">Current cached status</h3>
            <p className="text-sm text-muted-foreground">
              {diagnostics.live ? (
                <span className="font-medium text-emerald-600">Live</span>
              ) : (
                "Not live"
              )}{" "}
              — this reflects the last <code>stream.online</code>/
              <code>stream.offline</code> notification actually received and
              written to Redis, not a fresh poll of Twitch. If this looks
              wrong, the subscription status below is the more useful thing
              to check.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold">EventSub subscriptions (from Twitch)</h3>

            {!diagnostics.eventSub.ok ? (
              <p className="text-sm text-destructive">{diagnostics.eventSub.error}</p>
            ) : diagnostics.eventSub.subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No subscriptions found. Run{" "}
                <code>pnpm register-twitch-webhook</code> from a local
                checkout with production env vars (it can only be run
                against a deployed, publicly reachable instance).
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {diagnostics.eventSub.subscriptions.map((sub) => {
                  const callbackMismatch = sub.callback !== expectedCallbackUrl;
                  return (
                    <li key={sub.id} className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{sub.type}</span>
                        <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>
                      </div>
                      <span className="break-all text-xs text-muted-foreground">
                        {sub.callback}
                      </span>
                      {callbackMismatch ? (
                        <span className="text-xs text-destructive">
                          This doesn&apos;t match the current expected
                          callback ({expectedCallbackUrl}) — likely
                          registered against an old domain/URL. Re-run the
                          registration script.
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(sub.createdAt).toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="text-xs text-muted-foreground">
              A status other than <code>enabled</code> means Twitch will not
              actually deliver events for it. Common ones:{" "}
              <code>webhook_callback_verification_pending</code> (Twitch
              couldn&apos;t reach the callback URL during registration —
              check it&apos;s public and correct), and{" "}
              <code>notification_failures_exceeded</code> (this app failed
              to respond correctly too many times in a row and Twitch gave
              up).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
