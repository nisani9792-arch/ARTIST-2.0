"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { memo, type MouseEvent } from "react";
import { formatHebrewDateTime } from "@/lib/format";
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

const statusBadge: Record<ArtistStatus, string> = {
  signed: "bg-emerald-100 text-emerald-700",
  in_process: "bg-amber-100 text-amber-800",
  unsigned: "bg-slate-100 text-slate-600",
};

export type ArtistCardProps = {
  artist: Artist;
  selected: boolean;
  onSelect: (event: MouseEvent) => void;
  onOpenDetail: () => void;
  draggable?: boolean;
};

export const ArtistCard = memo(function ArtistCard({
  artist,
  selected,
  onSelect,
  onOpenDetail,
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
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onOpenDetail();
      }}
      title={artist.name}
      className={cn(
        "group relative flex flex-col gap-1 rounded-xl border bg-white p-2 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        "cursor-pointer select-none touch-manipulation",
        statusAccent[artist.status],
        selected && "ring-2 shadow-md -translate-y-0.5",
      )}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="size-3 shrink-0 rounded border-slate-300 accent-cyan-600"
        />

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
          {initials(artist.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[11px] font-bold leading-tight text-slate-900">
            {artist.name}
          </h3>
          {artist.handlerName && artist.handlerName !== "לא שויך" && (
            <p className="truncate text-[10px] text-gray-500">{artist.handlerName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 ps-5">
        <span className="truncate text-[9px] text-gray-500">
          {formatHebrewDateTime(artist.lastActionTimestamp)}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {artist.songCount > 0 && (
            <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold text-cyan-800">
              {artist.songCount} שירים
            </span>
          )}
          {artist.isOdooApproved && (
            <span className="rounded-full bg-emerald-600 px-1 py-0.5 text-[9px] font-bold text-white">
              Odoo
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              statusBadge[artist.status],
            )}
          >
            {STATUS_META[artist.status].label}
          </span>
        </div>
      </div>
    </article>
  );
});

export const ARTIST_CARD_HEIGHT = 62;
