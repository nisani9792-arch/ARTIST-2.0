"use client";

import { memo, type MouseEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatHebrewDateTime } from "@/lib/format";
import type { Artist, ArtistStatus } from "@/lib/types";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type EliteKanbanCardProps = {
  artist: Artist;
  selected: boolean;
  onSelect: (event: MouseEvent) => void;
  onOpenDetail: () => void;
};

export const EliteKanbanCard = memo(function EliteKanbanCard({
  artist,
  selected,
  onSelect,
  onOpenDetail,
}: EliteKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: artist.id,
    data: { artist },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`elite-card elite-card--${artist.status as ArtistStatus} ${selected ? "selected" : ""}`}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onOpenDetail();
      }}
      title={artist.name}
    >
      <input type="checkbox" className="elite-card-check" checked={selected} readOnly tabIndex={-1} aria-hidden />
      <span className="elite-card-initials">{initials(artist.name)}</span>
      <span className="elite-card-name">{artist.name}</span>
      {artist.handlerName && artist.handlerName !== "לא שויך" && (
        <span className="elite-card-meta">{artist.handlerName}</span>
      )}
      <span className="elite-card-meta">{formatHebrewDateTime(artist.lastActionTimestamp)}</span>
    </article>
  );
});
