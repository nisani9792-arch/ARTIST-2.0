"use client";

import { useDroppable } from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { ArtistCard } from "@/components/artist/ArtistCard";
import { cn } from "@/lib/cn";
import type { Artist } from "@/lib/types";

const CARD_HEIGHT = 108;
const GAP = 8;

type ArtistZoneProps = {
  zoneId: "unsigned" | "signed";
  title: string;
  icon: string;
  artists: Artist[];
  selectedIds: Set<string>;
  selectionMode: boolean;
  stuckIds: Set<string>;
  onSelect: (artist: Artist, event: React.MouseEvent) => void;
  onOdooToggle: (artist: Artist, approved: boolean) => void;
};

export function ArtistZone({
  zoneId,
  title,
  icon,
  artists,
  selectedIds,
  selectionMode,
  stuckIds,
  onSelect,
  onOdooToggle,
}: ArtistZoneProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + GAP,
    overscan: 8,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn("artist-zone", isOver && "artist-zone--over")}
      aria-label={title}
    >
      <header className="artist-zone__header">
        <span className="artist-zone__icon" aria-hidden>
          {icon}
        </span>
        <h2 className="artist-zone__title">{title}</h2>
        <span className="artist-zone__count">{artists.length}</span>
      </header>

      <div ref={parentRef} className="artist-zone__scroll">
        {artists.length === 0 ? (
          <p className="artist-zone__empty">אין אומנים באזור זה</p>
        ) : (
          <div
            className="artist-zone__list"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const artist = artists[item.index];
              return (
                <div
                  key={artist.id}
                  className="artist-zone__item"
                  style={{
                    transform: `translateY(${item.start}px)`,
                    height: `${CARD_HEIGHT}px`,
                  }}
                >
                  <ArtistCard
                    artist={artist}
                    selected={selectedIds.has(artist.id)}
                    selectionMode={selectionMode}
                    isStuck={stuckIds.has(artist.id)}
                    onSelect={(event) => onSelect(artist, event)}
                    onOdooToggle={(approved) => onOdooToggle(artist, approved)}
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
