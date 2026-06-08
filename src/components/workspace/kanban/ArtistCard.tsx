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
  signed:
    "border-emerald-200 bg-white hover:border-emerald-300 ring-emerald-500/30",
  in_process:
    "border-amber-200 bg-white hover:border-amber-300 ring-amber-500/30",
  unsigned:
    "border-slate-100 bg-white hover:border-slate-200 ring-cyan-500/30",
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
  /** When false, card is static (e.g. drag overlay clone). */
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
    data: { artist },
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
        "group relative flex flex-col gap-2 rounded-2xl border p-3",
        "bg-white shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        "cursor-pointer select-none touch-none",
        statusAccent[artist.status],
        selected && "ring-2 shadow-md -translate-y-0.5",
      )}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={selected}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="mt-1 size-3.5 shrink-0 rounded border-slate-300 accent-cyan-600"
        />

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "bg-blue-100 text-sm font-bold text-blue-700",
          )}
        >
          {initials(artist.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">{artist.name}</h3>
          {artist.handlerName && artist.handlerName !== "לא שויך" && (
            <p className="truncate text-xs text-gray-500">{artist.handlerName}</p>
          )}
          <p className="text-xs text-gray-500">
            {formatHebrewDateTime(artist.lastActionTimestamp)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 ps-5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            statusBadge[artist.status],
          )}
        >
          {STATUS_META[artist.status].label}
        </span>
        {artist.isOdooApproved && (
          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            Odoo
          </span>
        )}
      </div>
    </article>
  );
});

/** Fixed height for virtualized column rows */
export const ARTIST_CARD_HEIGHT = 88;
