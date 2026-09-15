"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SocialLink, LinkGroup } from "@/generated/prisma/client";
import {
  deleteSocialLinkAction,
  reorderSocialLinksAction,
  deleteLinkGroupAction,
  reorderLinkGroupsAction,
} from "@/modules/social-links/actions";
import { LinkFormDialog } from "@/modules/social-links/components/link-form-dialog";
import { GroupFormDialog } from "@/modules/social-links/components/group-form-dialog";
import { BrandIcon } from "@/modules/social-links/components/brand-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type GroupWithLinks = LinkGroup & { links: SocialLink[] };

function SortableLinkRow({
  link,
  rootDomain,
  groups,
  onDelete,
  onUpdated,
}: {
  link: SocialLink;
  rootDomain: string;
  groups: LinkGroup[];
  onDelete: (id: string) => void;
  onUpdated: (link: SocialLink) => void;
}) {
  const t = useTranslations("Dashboard.Links");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  return (
    <motion.li
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: "0.5rem", scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-[clamp(0.625rem,2vw,0.875rem)] shadow-sm transition-shadow hover:shadow-md data-[dragging=true]:shadow-lg"
      data-dragging={isDragging || undefined}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <BrandIcon
        platform={link.platform}
        url={link.url}
        iconUrl={link.icon}
        className="size-[clamp(2rem,6vw,2.5rem)]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">
          {link.platform} — {link.label}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <span className="truncate text-xs text-muted-foreground">
            {link.url}
          </span>
          {link.subdomain ? (
            <Badge variant="secondary" className="shrink-0">
              {link.subdomain}.{rootDomain}
            </Badge>
          ) : null}
          {!link.showOnProfile ? (
            <Badge variant="outline" className="shrink-0">
              {t("hidden")}
            </Badge>
          ) : null}
        </div>
      </div>

      <LinkFormDialog
        link={link}
        rootDomain={rootDomain}
        groups={groups}
        onSuccess={onUpdated}
        trigger={
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete"
        onClick={() => onDelete(link.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </motion.li>
  );
}

function LinkBucket({
  links,
  rootDomain,
  groups,
  onReorder,
  onDelete,
  onUpdated,
}: {
  links: SocialLink[];
  rootDomain: string;
  groups: LinkGroup[];
  onReorder: (orderedIds: string[]) => void;
  onDelete: (id: string) => void;
  onUpdated: (link: SocialLink) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    onReorder(arrayMove(links, oldIndex, newIndex).map((l) => l.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={links.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {links.map((link) => (
              <SortableLinkRow
                key={link.id}
                link={link}
                rootDomain={rootDomain}
                groups={groups}
                onDelete={onDelete}
                onUpdated={onUpdated}
              />
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableGroupSection({
  group,
  rootDomain,
  groups,
  onReorderLinks,
  onDeleteLink,
  onUpdatedLink,
  onGroupUpdated,
  onDeleteGroup,
}: {
  group: GroupWithLinks;
  rootDomain: string;
  groups: LinkGroup[];
  onReorderLinks: (groupId: string, orderedIds: string[]) => void;
  onDeleteLink: (id: string) => void;
  onUpdatedLink: (link: SocialLink) => void;
  onGroupUpdated: (group: LinkGroup) => void;
  onDeleteGroup: (id: string) => void;
}) {
  const t = useTranslations("Dashboard.Links");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id });

  return (
    <motion.li
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: "0.5rem" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-[clamp(0.75rem,2.5vw,1rem)] data-[dragging=true]:shadow-lg"
      data-dragging={isDragging || undefined}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label="Reorder group"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <h3 className="flex-1 truncate text-sm font-semibold">{group.label}</h3>
        <GroupFormDialog
          group={group}
          onSuccess={onGroupUpdated}
          trigger={
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit group">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete group"
          onClick={() => onDeleteGroup(group.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {group.links.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("groupEmpty")}</p>
      ) : (
        <LinkBucket
          links={group.links}
          rootDomain={rootDomain}
          groups={groups}
          onReorder={(orderedIds) => onReorderLinks(group.id, orderedIds)}
          onDelete={onDeleteLink}
          onUpdated={onUpdatedLink}
        />
      )}
    </motion.li>
  );
}

export function LinkList({
  initialUngrouped,
  initialGroups,
  rootDomain,
}: {
  initialUngrouped: SocialLink[];
  initialGroups: GroupWithLinks[];
  rootDomain: string;
}) {
  const t = useTranslations("Dashboard.Links");
  const [ungrouped, setUngrouped] = useState(initialUngrouped);
  const [groups, setGroups] = useState(initialGroups);
  const groupSensors = useSensors(useSensor(PointerSensor));

  const plainGroups: LinkGroup[] = groups.map((g) => ({
    id: g.id,
    label: g.label,
    order: g.order,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  }));

  function findLinkBucket(id: string): "ungrouped" | string | null {
    if (ungrouped.some((l) => l.id === id)) return "ungrouped";
    const group = groups.find((g) => g.links.some((l) => l.id === id));
    return group?.id ?? null;
  }

  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    const reordered = arrayMove(groups, oldIndex, newIndex);
    setGroups(reordered);
    reorderLinkGroupsAction(reordered.map((g) => g.id)).then((result) => {
      if (!result.success) {
        toast.error(result.error);
        setGroups(groups);
      }
    });
  }

  async function handleReorderBucket(
    groupId: string | null,
    orderedIds: string[]
  ) {
    const previousUngrouped = ungrouped;
    const previousGroups = groups;

    if (groupId === null) {
      setUngrouped((current) =>
        orderedIds
          .map((id) => current.find((l) => l.id === id)!)
          .filter(Boolean)
      );
    } else {
      setGroups((current) =>
        current.map((g) =>
          g.id === groupId
            ? {
                ...g,
                links: orderedIds
                  .map((id) => g.links.find((l) => l.id === id)!)
                  .filter(Boolean),
              }
            : g
        )
      );
    }

    const result = await reorderSocialLinksAction(orderedIds);
    if (!result.success) {
      toast.error(result.error);
      setUngrouped(previousUngrouped);
      setGroups(previousGroups);
    }
  }

  async function handleDeleteLink(id: string) {
    const previousUngrouped = ungrouped;
    const previousGroups = groups;
    const bucket = findLinkBucket(id);

    if (bucket === "ungrouped") {
      setUngrouped((current) => current.filter((l) => l.id !== id));
    } else if (bucket) {
      setGroups((current) =>
        current.map((g) =>
          g.id === bucket
            ? { ...g, links: g.links.filter((l) => l.id !== id) }
            : g
        )
      );
    }

    const result = await deleteSocialLinkAction(id);
    if (!result.success) {
      toast.error(result.error);
      setUngrouped(previousUngrouped);
      setGroups(previousGroups);
      return;
    }
    toast.success(t("linkDeleted"));
  }

  function handleCreatedLink(link: SocialLink) {
    if (!link.groupId) {
      setUngrouped((current) => [...current, link]);
      return;
    }
    setGroups((current) =>
      current.map((g) =>
        g.id === link.groupId ? { ...g, links: [...g.links, link] } : g
      )
    );
  }

  function handleUpdatedLink(updated: SocialLink) {
    const previousBucket = findLinkBucket(updated.id);
    const newBucket = updated.groupId ?? "ungrouped";

    if (previousBucket === newBucket) {
      // Same bucket -- replace in place, no reordering happened.
      if (newBucket === "ungrouped") {
        setUngrouped((current) =>
          current.map((l) => (l.id === updated.id ? updated : l))
        );
      } else {
        setGroups((current) =>
          current.map((g) =>
            g.id === newBucket
              ? {
                  ...g,
                  links: g.links.map((l) => (l.id === updated.id ? updated : l)),
                }
              : g
          )
        );
      }
      return;
    }

    // Moved to a different bucket -- remove from the old one, append to the
    // new one (the server always places a moved link at the end of its new
    // bucket, see service.ts).
    if (previousBucket === "ungrouped") {
      setUngrouped((current) => current.filter((l) => l.id !== updated.id));
    } else if (previousBucket) {
      setGroups((current) =>
        current.map((g) =>
          g.id === previousBucket
            ? { ...g, links: g.links.filter((l) => l.id !== updated.id) }
            : g
        )
      );
    }

    if (newBucket === "ungrouped") {
      setUngrouped((current) => [...current, updated]);
    } else {
      setGroups((current) =>
        current.map((g) =>
          g.id === newBucket ? { ...g, links: [...g.links, updated] } : g
        )
      );
    }
  }

  function handleGroupCreated(group: LinkGroup) {
    setGroups((current) => [...current, { ...group, links: [] }]);
  }

  function handleGroupUpdated(group: LinkGroup) {
    setGroups((current) =>
      current.map((g) => (g.id === group.id ? { ...g, ...group } : g))
    );
  }

  async function handleDeleteGroup(id: string) {
    const previousGroups = groups;
    const previousUngrouped = ungrouped;
    const group = groups.find((g) => g.id === id);

    setGroups((current) => current.filter((g) => g.id !== id));
    if (group) {
      setUngrouped((current) => [...current, ...group.links]);
    }

    const result = await deleteLinkGroupAction(id);
    if (!result.success) {
      toast.error(result.error);
      setGroups(previousGroups);
      setUngrouped(previousUngrouped);
      return;
    }
    toast.success(t("groupDeleted"));
  }

  const isEmpty = ungrouped.length === 0 && groups.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{t("heading")}</h2>
        <div className="flex items-center gap-2">
          <GroupFormDialog
            onSuccess={handleGroupCreated}
            trigger={
              <Button type="button" variant="outline">
                {t("addGroup")}
              </Button>
            }
          />
          <LinkFormDialog
            rootDomain={rootDomain}
            groups={plainGroups}
            onSuccess={handleCreatedLink}
            trigger={<Button type="button">{t("addLink")}</Button>}
          />
        </div>
      </div>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground">{t("noLinks")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {ungrouped.length > 0 ? (
            <LinkBucket
              links={ungrouped}
              rootDomain={rootDomain}
              groups={plainGroups}
              onReorder={(orderedIds) => handleReorderBucket(null, orderedIds)}
              onDelete={handleDeleteLink}
              onUpdated={handleUpdatedLink}
            />
          ) : null}

          {groups.length > 0 ? (
            <DndContext
              sensors={groupSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleGroupDragEnd}
            >
              <SortableContext
                items={groups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {groups.map((group) => (
                      <SortableGroupSection
                        key={group.id}
                        group={group}
                        rootDomain={rootDomain}
                        groups={plainGroups}
                        onReorderLinks={handleReorderBucket}
                        onDeleteLink={handleDeleteLink}
                        onUpdatedLink={handleUpdatedLink}
                        onGroupUpdated={handleGroupUpdated}
                        onDeleteGroup={handleDeleteGroup}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </SortableContext>
            </DndContext>
          ) : null}
        </div>
      )}
    </div>
  );
}
