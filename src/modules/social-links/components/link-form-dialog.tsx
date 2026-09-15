"use client";

import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  socialLinkSchema,
  type SocialLinkInput,
} from "@/modules/social-links/schema";
import {
  createSocialLinkAction,
  updateSocialLinkAction,
} from "@/modules/social-links/actions";
import type { SocialLink, LinkGroup } from "@/generated/prisma/client";
import { BrandIcon } from "@/modules/social-links/components/brand-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  groups,
  onSuccess,
}: {
  link?: SocialLink;
  trigger: ReactElement;
  rootDomain: string;
  groups: LinkGroup[];
  onSuccess: (link: SocialLink) => void;
}) {
  const t = useTranslations("Dashboard.Links");
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
      groupId: link?.groupId ?? "",
    },
  });

  const showOnProfile = watch("showOnProfile");
  const subdomain = watch("subdomain");
  const platform = watch("platform");
  const url = watch("url");
  const icon = watch("icon");
  const groupId = watch("groupId");

  async function onSubmit(data: SocialLinkInput) {
    setFormError(null);
    const result = isEdit
      ? await updateSocialLinkAction(link.id, data)
      : await createSocialLinkAction(data);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    toast.success(isEdit ? t("linkUpdated") : t("linkAdded"));
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
          <DialogTitle>{isEdit ? t("editLink") : t("addLink")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.platform || undefined}>
              <FieldLabel htmlFor="platform">{t("platform")}</FieldLabel>
              <div className="flex items-center gap-2">
                <BrandIcon
                  platform={platform || ""}
                  url={url}
                  iconUrl={icon}
                  className="size-8"
                />
                <Input
                  id="platform"
                  placeholder="Instagram"
                  className="flex-1"
                  {...register("platform")}
                />
              </div>
              <FieldError
                errors={errors.platform ? [errors.platform] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.label || undefined}>
              <FieldLabel htmlFor="label">{t("label")}</FieldLabel>
              <Input
                id="label"
                placeholder="@aboutselphy"
                {...register("label")}
              />
              <FieldError errors={errors.label ? [errors.label] : undefined} />
            </Field>

            <Field data-invalid={!!errors.url || undefined}>
              <FieldLabel htmlFor="url">{t("url")}</FieldLabel>
              <Input
                id="url"
                type="url"
                placeholder="https://instagram.com/aboutselphy"
                {...register("url")}
              />
              <FieldError errors={errors.url ? [errors.url] : undefined} />
            </Field>

            <Field data-invalid={!!errors.icon || undefined}>
              <FieldLabel htmlFor="icon">{t("iconUrl")}</FieldLabel>
              <Input id="icon" type="url" {...register("icon")} />
              <FieldDescription>{t("iconUrlHint")}</FieldDescription>
              <FieldError errors={errors.icon ? [errors.icon] : undefined} />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="group">{t("group")}</FieldLabel>
              <Select
                value={groupId || "none"}
                onValueChange={(value) =>
                  setValue("groupId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger id="group" className="w-full">
                  <SelectValue placeholder={t("noGroup")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noGroup")}</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              orientation="horizontal"
              data-invalid={!!errors.subdomain || undefined}
            >
              <FieldLabel htmlFor="subdomain">{t("subdomain")}</FieldLabel>
              <Input
                id="subdomain"
                placeholder="instagram"
                {...register("subdomain")}
              />
            </Field>
            {subdomain ? (
              <FieldDescription>
                {t("subdomainPreview", { subdomain, rootDomain })}
              </FieldDescription>
            ) : null}
            <FieldError
              errors={errors.subdomain ? [errors.subdomain] : undefined}
            />

            <Field orientation="horizontal">
              <FieldLabel htmlFor="showOnProfile">
                {t("showOnProfile")}
              </FieldLabel>
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
              {isSubmitting
                ? t("saving")
                : isEdit
                  ? t("saveChanges")
                  : t("addLink")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
