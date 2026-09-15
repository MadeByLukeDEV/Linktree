"use client";

import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  socialLinkSchema,
  type SocialLinkInput,
} from "@/modules/social-links/schema";
import {
  createSocialLinkAction,
  updateSocialLinkAction,
} from "@/modules/social-links/actions";
import type { SocialLink } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";

export function LinkFormDialog({
  link,
  trigger,
  rootDomain,
  onSuccess,
}: {
  link?: SocialLink;
  trigger: ReactElement;
  rootDomain: string;
  onSuccess: (link: SocialLink) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = !!link;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SocialLinkInput>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: {
      platform: link?.platform ?? "",
      label: link?.label ?? "",
      url: link?.url ?? "",
      icon: link?.icon ?? "",
      showOnProfile: link?.showOnProfile ?? true,
      subdomain: link?.subdomain ?? "",
    },
  });

  const showOnProfile = watch("showOnProfile");
  const subdomain = watch("subdomain");

  async function onSubmit(data: SocialLinkInput) {
    setFormError(null);
    const result = isEdit
      ? await updateSocialLinkAction(link.id, data)
      : await createSocialLinkAction(data);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    toast.success(isEdit ? "Link updated" : "Link added");
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
          <DialogTitle>{isEdit ? "Edit link" : "Add a link"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.platform || undefined}>
              <FieldLabel htmlFor="platform">Platform</FieldLabel>
              <Input
                id="platform"
                placeholder="Instagram"
                {...register("platform")}
              />
              <FieldError
                errors={errors.platform ? [errors.platform] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.label || undefined}>
              <FieldLabel htmlFor="label">Label</FieldLabel>
              <Input
                id="label"
                placeholder="@aboutselphy"
                {...register("label")}
              />
              <FieldError errors={errors.label ? [errors.label] : undefined} />
            </Field>

            <Field data-invalid={!!errors.url || undefined}>
              <FieldLabel htmlFor="url">URL</FieldLabel>
              <Input
                id="url"
                type="url"
                placeholder="https://instagram.com/aboutselphy"
                {...register("url")}
              />
              <FieldError errors={errors.url ? [errors.url] : undefined} />
            </Field>

            <Field data-invalid={!!errors.icon || undefined}>
              <FieldLabel htmlFor="icon">Icon URL (optional)</FieldLabel>
              <Input id="icon" type="url" {...register("icon")} />
              <FieldError errors={errors.icon ? [errors.icon] : undefined} />
            </Field>

            <Field
              orientation="horizontal"
              data-invalid={!!errors.subdomain || undefined}
            >
              <FieldLabel htmlFor="subdomain">
                Subdomain forward (optional)
              </FieldLabel>
              <Input
                id="subdomain"
                placeholder="instagram"
                {...register("subdomain")}
              />
            </Field>
            {subdomain ? (
              <FieldDescription>
                {subdomain}.{rootDomain} will redirect to this URL
              </FieldDescription>
            ) : null}
            <FieldError
              errors={errors.subdomain ? [errors.subdomain] : undefined}
            />

            <Field orientation="horizontal">
              <FieldLabel htmlFor="showOnProfile">Show on profile</FieldLabel>
              <Switch
                id="showOnProfile"
                checked={showOnProfile}
                onCheckedChange={(checked) =>
                  setValue("showOnProfile", checked)
                }
              />
            </Field>

            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Add link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
