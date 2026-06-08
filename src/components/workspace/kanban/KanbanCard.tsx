"use client";

import { memo, type DragEvent, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { formatHebrewDateTime } from "@/lib/format";
import type { Artist } from "@/lib/types";
import { COMPACT_CARD_HEIGHT } from "./constants";

type KanbanCardProps = {
  artist: Artist;
  tone: string;
  selected: boolean;
  onSelect: (event: MouseEvent) => void;
  onOpenDetail: () => void;
  onDragStart?: (event: DragEvent, artistId: string) => void;
};

export const KanbanCard = memo(function KanbanCard({
  artist,
  tone,
  selected,
  onSelect,
  onOpenDetail,
  onDragStart,
}: KanbanCardProps) {
  return (
    <article
      role="listitem"
      draggable
      style={{ height: COMPACT_CARD_HEIGHT, maxHeight: COMPACT_CARD_HEIGHT }}
      className={cn(
        "kanban-card",
        selected && "kanban-card--selected",
        artist.isOdooApproved && "kanban-card--odoo",
        `kanban-card--${tone}`,
      )}
      onClick={(event) => {
        event.preventDefault();
        onSelect(event);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        onOpenDetail();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenDetail();
      }}
      onDragStart={(event) => onDragStart?.(event, artist.id)}
      title={`${artist.name} · ${artist.handlerName}\nלחיצה = בחירה · לחיצה כפולה = פרטים`}
    >
      <input
        type="checkbox"
        checked={selected}
        readOnly
        tabIndex={-1}
        className="kanban-card__check"
        aria-hidden
      />

      <div className="kanban-card__body">
        <span className="kanban-card__name">{artist.name}</span>
        <span className="kanban-card__meta">
          <span className="kanban-card__handler">{artist.handlerName}</span>
          <time className="kanban-card__time" dateTime={artist.lastActionTimestamp}>
            {formatHebrewDateTime(artist.lastActionTimestamp)}
          </time>
        </span>
      </div>

      {artist.isOdooApproved && (
        <span className="kanban-card__odoo" title="מאושר באודו" aria-label="מאושר באודו">
          ✓
        </span>
      )}
    </article>
  );
});
