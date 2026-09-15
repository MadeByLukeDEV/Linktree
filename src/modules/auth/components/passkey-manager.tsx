"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function PasskeyRow({
  passkey,
  onRenamed,
  onDeleted,
}: {
  passkey: { id: string; name?: string | null };
  onRenamed: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("Dashboard.Security");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(passkey.name ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSaveName() {
    setBusy(true);
    const { error } = await authClient.passkey.updatePasskey({
      id: passkey.id,
      name: name.trim() || t("unnamedPasskey"),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? t("couldNotRenamePasskey"));
      return;
    }
    toast.success(t("passkeyRenamed"));
    setEditing(false);
    onRenamed();
  }

  async function handleDelete() {
    setBusy(true);
    const { error } = await authClient.passkey.deletePasskey({
      id: passkey.id,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? t("couldNotDeletePasskey"));
      return;
    }
    toast.success(t("passkeyDeleted"));
    onDeleted();
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: "0.5rem" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm shadow-sm"
    >
      {editing ? (
        <>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            className="h-7"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            aria-label="Save"
            onClick={handleSaveName}
          >
            <Check className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            aria-label="Cancel"
            onClick={() => {
              setName(passkey.name ?? "");
              setEditing(false);
            }}
          >
            <X className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate">
            {passkey.name || t("unnamedPasskey")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("renamePasskey")}
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            aria-label={t("deletePasskey")}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </motion.li>
  );
}

export function PasskeyManager() {
  const t = useTranslations("Dashboard.Security");
  const { data: passkeys, isPending, refetch } = authClient.useListPasskeys();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setError(null);
    setAdding(true);
    const { error } = await authClient.passkey.addPasskey(
      newName.trim() ? { name: newName.trim() } : undefined
    );
    setAdding(false);
    if (error) {
      setError(error.message ?? t("couldNotAddPasskey"));
      return;
    }
    setNewName("");
    refetch();
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{t("heading")}</h2>

      {isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : passkeys && passkeys.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {passkeys.map((passkey) => (
              <PasskeyRow
                key={passkey.id}
                passkey={passkey}
                onRenamed={refetch}
                onDeleted={refetch}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noPasskeys")}</p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="max-w-[16rem]"
        />
        <Button
          type="button"
          variant="outline"
          disabled={adding}
          onClick={handleAdd}
        >
          {adding ? t("waitingForAuthenticator") : t("addPasskey")}
        </Button>
      </div>
    </div>
  );
}
