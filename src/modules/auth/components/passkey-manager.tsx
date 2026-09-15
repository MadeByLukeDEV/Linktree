"use client";

import { useState } from "react";
import { authClient } from "@/modules/auth/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PasskeyManager() {
  const { data: passkeys, isPending, refetch } = authClient.useListPasskeys();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setError(null);
    setAdding(true);
    const { error } = await authClient.passkey.addPasskey();
    setAdding(false);
    if (error) {
      setError(error.message ?? "Could not add passkey");
      return;
    }
    refetch();
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Passkeys</h2>

      {isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : passkeys && passkeys.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {passkeys.map((passkey) => (
            <li
              key={passkey.id}
              className="rounded-lg border border-border px-2.5 py-1.5 text-sm"
            >
              {passkey.name ?? "Unnamed passkey"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No passkeys registered yet. Add one to sign in with a hardware
          security key or a passkey manager like Bitwarden instead of your
          password.
        </p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={adding}
          onClick={handleAdd}
        >
          {adding ? "Waiting for authenticator…" : "Add a passkey"}
        </Button>
      </div>
    </div>
  );
}
