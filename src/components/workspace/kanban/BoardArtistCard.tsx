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
  signed: "border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 hover:border-emerald-300 ring-emerald-500/25",
  in_process: "border-amber-200/80 bg-gradient-to-br from-white to-amber-50/40 hover:border-amber-300 ring-amber-500/25",
  unsigned: "border-slate-200 bg-white",
};

const statusBadge: Record<ArtistStatus, string> = {
  signed: "bg-emerald-600 text-white",
  in_process: "bg-amber-500 text-white",
  unsigned: "bg-slate-500 text-white",
};

export type BoardArtistCardProps = {
  artist: Artist;
  selected: boolean;
  onSelect: (event: MouseEvent) => void;
  onOpenDetail: () => void;
  onContextMenu?: (event: MouseEvent) => void;
  draggable?: boolean;
};

export const BoardArtistCard = memo(function BoardArtistCard({
  artist,
  selected,
  onSelect,
  onOpenDetail,
  onContextMenu,
  draggable = true,
}: BoardArtistCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: artist.id,
    data: { type: "artist", artist },
    disabled: !draggable,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  const notes = artist.notes?.trim();

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
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e);
      }}
      title={artist.name}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-2xl border p-3.5 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        "cursor-grab select-none touch-manipulation active:cursor-grabbing",
        statusAccent[artist.status],
        selected && "ring-2 shadow-lg -translate-y-0.5",
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="mt-1 size-3.5 shrink-0 rounded border-slate-300 accent-cyan-600"
        />

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-extrabold text-slate-700 shadow-inner">
          {initials(artist.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold leading-tight text-slate-900">
            {artist.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                statusBadge[artist.status],
              )}
            >
              {STATUS_META[artist.status].label}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                artist.isOdooApproved
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              Odoo {artist.isOdooApproved ? "✓" : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-200/60 pt-2.5 text-[10px]">
        <div>
          <span className="font-bold text-slate-500">תאריך שינוי</span>
          <p className="truncate font-medium text-slate-800">
            {formatHebrewDateTime(artist.lastActionTimestamp)}
          </p>
        </div>
        <div>
          <span className="font-bold text-slate-500">גורם מטפל</span>
          <p className="truncate font-medium text-slate-800">
            {artist.handlerName || "לא שויך"}
          </p>
        </div>
        {notes && (
          <div className="col-span-2">
            <span className="font-bold text-slate-500">הערות</span>
            <p className="line-clamp-2 font-medium leading-snug text-slate-700">{notes}</p>
          </div>
        )}
      </div>
    </article>
  );
});

export const BOARD_ARTIST_CARD_HEIGHT = 128;
