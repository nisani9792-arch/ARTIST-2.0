"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { memo, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const statusAccent: Record<ArtistStatus, string> = {
  signed: "border-emerald-200 hover:border-emerald-300 ring-emerald-500/30",
  in_process: "border-amber-200 hover:border-amber-300 ring-amber-500/30",
  unsigned: "border-slate-100 hover:border-slate-200 ring-cyan-500/30",
};

export type ArtistCardProps = {
  artist: Artist;
  selected: boolean;
  onSelect: (event: MouseEvent) => void;
  onOpenDetail: () => void;
  onContextMenu?: (event: MouseEvent) => void;
  draggable?: boolean;
};

export const ArtistCard = memo(function ArtistCard({
  artist,
  selected,
  onSelect,
  onOpenDetail,
  onContextMenu,
  draggable = true,
}: ArtistCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: artist.id,
    data: { type: "artist", artist },
    disabled: !draggable,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.45 : 1 }
    : undefined;

  return (
    <article
      ref={draggable ? setNodeRef : undefined}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onOpenDetail();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e);
      }}
      title={artist.name}
      className={cn(
        "group relative flex items-center gap-2 rounded-xl border bg-white px-2 py-2 shadow-sm",
        "transition-all duration-150 select-none touch-manipulation",
        statusAccent[artist.status],
        selected && "ring-2 shadow-md",
        isDragging && "opacity-40",
      )}
    >
      {draggable && (
        <button
          type="button"
          className="shrink-0 cursor-grab rounded px-0.5 text-sm text-slate-400 hover:text-slate-600 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          aria-label={`גרור ${artist.name}`}
          title="החזק חצי שנייה לגרירה"
        >
          ⠿
        </button>
      )}

      <input
        type="checkbox"
        checked={selected}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="size-3.5 shrink-0 rounded border-slate-300 accent-cyan-600"
      />

      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
        {initials(artist.name)}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold leading-tight text-slate-900">{artist.name}</h3>
        <p className="truncate text-[10px] text-gray-500">
          {STATUS_META[artist.status].label}
          {artist.handlerName && artist.handlerName !== "לא שויך" && ` · ${artist.handlerName}`}
          {artist.isOdooApproved && " · Odoo ✓"}
        </p>
      </div>
    </article>
  );
});

export const ARTIST_CARD_HEIGHT = 52;
