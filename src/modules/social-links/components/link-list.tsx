"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import type { SocialLink } from "@/generated/prisma/client";
import { deleteSocialLinkAction, reorderSocialLinksAction } from "@/modules/social-links/actions";
import { LinkFormDialog } from "@/modules/social-links/components/link-form-dialog";
import { Button } from "@/components/ui/button";

function SortableLinkRow({
  link,
  rootDomain,
  onDelete,
  onUpdated,
}: {
  link: SocialLink;
  rootDomain: string;
  onDelete: (id: string) => void;
  onUpdated: (link: SocialLink) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  return (
    <motion.li
      ref={setNodeRef}
      layout
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-[clamp(0.5rem,1.5vw,0.75rem)]"
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

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {link.platform} — {link.label}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {link.url}
          {link.subdomain ? ` · ${link.subdomain}.${rootDomain}` : ""}
          {!link.showOnProfile ? " · hidden" : ""}
        </span>
      </div>

      <LinkFormDialog
        link={link}
        rootDomain={rootDomain}
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

export function LinkList({
  initialLinks,
  rootDomain,
}: {
  initialLinks: SocialLink[];
  rootDomain: string;
}) {
  const [links, setLinks] = useState(initialLinks);
  const sensors = useSensors(useSensor(PointerSensor));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered);

    const result = await reorderSocialLinksAction(reordered.map((l) => l.id));
    if (!result.success) {
      toast.error(result.error);
      setLinks(links);
    }
  }

  async function handleDelete(id: string) {
    const previous = links;
    setLinks((current) => current.filter((l) => l.id !== id));
    const result = await deleteSocialLinkAction(id);
    if (!result.success) {
      toast.error(result.error);
      setLinks(previous);
      return;
    }
    toast.success("Link deleted");
  }

  function handleCreated(link: SocialLink) {
    setLinks((current) => [...current, link]);
  }

  function handleUpdated(updated: SocialLink) {
    setLinks((current) =>
      current.map((l) => (l.id === updated.id ? updated : l))
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Links</h2>
        <LinkFormDialog
          rootDomain={rootDomain}
          onSuccess={handleCreated}
          trigger={<Button type="button">Add link</Button>}
        />
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No links yet. Add your first one above.
        </p>
      ) : (
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
                    onDelete={handleDelete}
                    onUpdated={handleUpdated}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
