"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatHebrewDateTime, statusLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Artist } from "@/lib/types";

type ArtistCardProps = {
  artist: Artist;
  selected: boolean;
  selectionMode: boolean;
  isStuck: boolean;
  onSelect: (event: React.MouseEvent) => void;
  onOdooToggle?: (approved: boolean) => void;
};

export function ArtistCard({
  artist,
  selected,
  selectionMode,
  isStuck,
  onSelect,
  onOdooToggle,
}: ArtistCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: artist.id,
    data: { artist },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={cn(
        "artist-card",
        selected && "artist-card--selected",
        isDragging && "artist-card--dragging",
        isStuck && "artist-card--stuck",
        artist.isOdooApproved && "artist-card--odoo-approved",
      )}
    >
      {artist.isOdooApproved && (
        <span className="artist-card__odoo-badge" title="מאושר באודו" aria-label="מאושר באודו">
          ✓
        </span>
      )}

      {selectionMode && (
        <input
          type="checkbox"
          checked={selected}
          readOnly
          tabIndex={-1}
          className="artist-card__check"
          aria-hidden
        />
      )}

      <div className="artist-card__name" title={artist.name}>
        {artist.name}
      </div>

      <div className="artist-card__meta">
        <span
          className={cn(
            "artist-card__status",
            artist.isSigned && "artist-card__status--signed",
          )}
        >
          {statusLabel(artist.isSigned)}
        </span>
        <span className="artist-card__handler" title={artist.handlerName}>
          {artist.handlerName}
        </span>
      </div>

      <time className="artist-card__time" dateTime={artist.lastActionTimestamp}>
        {formatHebrewDateTime(artist.lastActionTimestamp)}
      </time>

      <label
        className="artist-card__odoo"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={artist.isOdooApproved}
          onChange={(e) => onOdooToggle?.(e.target.checked)}
          className="artist-card__odoo-input"
          aria-label={`אישור באודו — ${artist.name}`}
        />
        <span>אישור באודו</span>
      </label>
    </article>
  );
}
