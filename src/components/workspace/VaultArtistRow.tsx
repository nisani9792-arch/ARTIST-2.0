"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { STATUS_META, type Artist } from "@/lib/types";

type VaultArtistRowProps = {
  artist: Artist;
  selected: boolean;
  draggable?: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
};

export function VaultArtistRow({
  artist,
  selected,
  draggable = false,
  onSelect,
  onOpenDetail,
}: VaultArtistRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: artist.id,
    data: { type: "artist", artist },
    disabled: !draggable,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }
    : undefined;

  return (
    <div
      ref={draggable ? setNodeRef : undefined}
      style={style}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-lg px-1 py-0.5 transition",
        selected && "bg-cyan-50 ring-1 ring-cyan-200",
        isDragging && "z-10",
      )}
    >
      {draggable && (
        <button
          type="button"
          className="shrink-0 cursor-grab rounded px-0.5 text-[10px] text-slate-400 hover:text-slate-600 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label={`גרור ${artist.name}`}
          title="גרור לעמודה"
        >
          ⠿
        </button>
      )}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-start hover:bg-slate-100/80"
        onClick={onSelect}
        onDoubleClick={onOpenDetail}
        title={artist.name}
      >
        <input
          type="checkbox"
          checked={selected}
          readOnly
          tabIndex={-1}
          className="size-3 shrink-0 rounded border-slate-300 accent-cyan-600"
        />
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800">
          {artist.name}
        </span>
        <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
          {STATUS_META[artist.status].label}
        </span>
      </button>
    </div>
  );
}
