"use client";

import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  linkGroupSchema,
  type LinkGroupInput,
} from "@/modules/social-links/schema";
import {
  createLinkGroupAction,
  updateLinkGroupAction,
} from "@/modules/social-links/actions";
import type { LinkGroup } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export function GroupFormDialog({
  group,
  trigger,
  onSuccess,
}: {
  group?: LinkGroup;
  trigger: ReactElement;
  onSuccess: (group: LinkGroup) => void;
}) {
  const t = useTranslations("Dashboard.Links");
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = !!group;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LinkGroupInput>({
    resolver: zodResolver(linkGroupSchema),
    defaultValues: { label: group?.label ?? "" },
  });

  async function onSubmit(data: LinkGroupInput) {
    setFormError(null);
    const result = isEdit
      ? await updateLinkGroupAction(group.id, data)
      : await createLinkGroupAction(data);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    toast.success(isEdit ? t("groupUpdated") : t("groupAdded"));
    onSuccess(result.data);
    setOpen(false);
    if (!isEdit) {
      reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editGroup") : t("addGroup")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field data-invalid={!!errors.label || undefined}>
            <FieldLabel htmlFor="group-label">{t("groupName")}</FieldLabel>
            <Input
              id="group-label"
              placeholder="Partners"
              {...register("label")}
            />
            <FieldError errors={errors.label ? [errors.label] : undefined} />
          </Field>

          {formError ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("saving")
                : isEdit
                  ? t("saveChanges")
                  : t("addGroup")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
