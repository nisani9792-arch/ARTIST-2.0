"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type DragEvent } from "react";
import type { Artist } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";
import { COMPACT_CARD_HEIGHT, type KanbanColumnId } from "./constants";
import { buildDragIdPayload } from "./selection";

type KanbanColumnProps = {
  columnId: KanbanColumnId;
  label: string;
  tone: string;
  artists: Artist[];
  selectedIds: Set<string>;
  dragOver: boolean;
  onSelectArtist: (artist: Artist, event: React.MouseEvent) => void;
  onOpenDetail: (artist: Artist) => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent, columnId: KanbanColumnId) => void;
};

export function KanbanColumn({
  columnId,
  label,
  tone,
  artists,
  selectedIds,
  dragOver,
  onSelectArtist,
  onOpenDetail,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanColumnProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => COMPACT_CARD_HEIGHT + 4,
    overscan: 16,
  });

  const handleDragStart = (event: DragEvent, artistId: string) => {
    const payload = buildDragIdPayload(artistId, selectedIds);
    event.dataTransfer.setData("application/x-artist-ids", payload);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <section
      className={cnColumn(dragOver)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, columnId)}
      aria-label={`עמודת ${label}`}
    >
      <header className="kanban-column__header">
        <span className={`kanban-column__badge kanban-column__badge--${tone}`}>{label}</span>
        <span className="kanban-column__count">{artists.length.toLocaleString("he-IL")}</span>
      </header>

      <div ref={parentRef} className="kanban-column__scroll">
        {artists.length === 0 ? (
          <p className="kanban-column__empty">אין אומנים בעמודה זו</p>
        ) : (
          <div
            className="kanban-column__list"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const artist = artists[virtualRow.index];
              return (
                <div
                  key={artist.id}
                  className="kanban-column__item"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <KanbanCard
                    artist={artist}
                    tone={tone}
                    selected={selectedIds.has(artist.id)}
                    onSelect={(event) => onSelectArtist(artist, event)}
                    onOpenDetail={() => onOpenDetail(artist)}
                    onDragStart={handleDragStart}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function cnColumn(dragOver: boolean) {
  return dragOver ? "kanban-column kanban-column--drop" : "kanban-column";
}
