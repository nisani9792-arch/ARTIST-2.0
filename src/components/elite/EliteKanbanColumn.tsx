"use client";

import { useDroppable } from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type MouseEvent } from "react";
import type { Artist, ArtistStatus } from "@/lib/types";
import { EliteKanbanCard } from "./EliteKanbanCard";

const CARD_HEIGHT = 108;
const COLS = 2;

type EliteKanbanColumnProps = {
  status: ArtistStatus;
  label: string;
  artists: Artist[];
  selectedIds: Set<string>;
  onSelectArtist: (artist: Artist, event: MouseEvent) => void;
  onOpenDetail: (artist: Artist) => void;
  onSelectAll: (checked: boolean) => void;
};

export function EliteKanbanColumn({
  status,
  label,
  artists,
  selectedIds,
  onSelectArtist,
  onOpenDetail,
  onSelectAll,
}: EliteKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(artists.length / COLS);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + 8,
    overscan: 8,
  });

  const allSelected = artists.length > 0 && artists.every((a) => selectedIds.has(a.id));

  return (
    <section ref={setNodeRef} className={`elite-kanban-col ${isOver ? "elite-kanban-col--over" : ""}`}>
      <header className="elite-kanban-col-header">
        <span>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, opacity: 0.7 }}>{artists.length.toLocaleString("he-IL")}</span>
          <label style={{ fontSize: 11, cursor: "pointer", display: "flex", gap: 4 }}>
            <input type="checkbox" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} />
            הכל
          </label>
        </div>
      </header>
      <div ref={parentRef} style={{ flex: 1, overflowY: "auto", padding: 8, minHeight: 0 }}>
        {artists.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: 11, opacity: 0.6, padding: "24px 0" }}>אין אומנים</p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((row) => {
              const startIdx = row.index * COLS;
              const rowArtists = artists.slice(startIdx, startIdx + COLS);
              return (
                <div
                  key={row.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${row.start}px)`,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    paddingBottom: 8,
                  }}
                >
                  {rowArtists.map((artist) => (
                    <EliteKanbanCard
                      key={artist.id}
                      artist={artist}
                      selected={selectedIds.has(artist.id)}
                      onSelect={(event) => onSelectArtist(artist, event)}
                      onOpenDetail={() => onOpenDetail(artist)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
