"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { profileSchema, type ProfileInput } from "@/modules/profile/schema";
import { saveProfileAction } from "@/modules/profile/actions";
import type { Profile } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const t = useTranslations("Dashboard.Profile");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName ?? "",
      bio: profile?.bio ?? "",
      avatarUrl: profile?.avatarUrl ?? "",
    },
  });

  async function onSubmit(data: ProfileInput) {
    setFormError(null);
    const result = await saveProfileAction(data);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    toast.success(t("profileSaved"));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.displayName || undefined}>
          <FieldLabel htmlFor="displayName">{t("displayName")}</FieldLabel>
          <Input id="displayName" {...register("displayName")} />
          <FieldError
            errors={errors.displayName ? [errors.displayName] : undefined}
          />
        </Field>

        <Field data-invalid={!!errors.bio || undefined}>
          <FieldLabel htmlFor="bio">{t("bio")}</FieldLabel>
          <Textarea id="bio" rows={4} {...register("bio")} />
          <FieldError errors={errors.bio ? [errors.bio] : undefined} />
        </Field>

        <Field data-invalid={!!errors.avatarUrl || undefined}>
          <FieldLabel htmlFor="avatarUrl">{t("avatarUrl")}</FieldLabel>
          <Input id="avatarUrl" type="url" {...register("avatarUrl")} />
          <FieldError
            errors={errors.avatarUrl ? [errors.avatarUrl] : undefined}
          />
        </Field>

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("saveProfile")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
