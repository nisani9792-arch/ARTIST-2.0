"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { MAIN_BOARD_STATUSES, STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { selectRangeInColumn } from "./selection";
import { ArtistCard } from "./ArtistCard";
import { KanbanColumn } from "./KanbanColumn";

export type KanbanBoardProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onOpenDetail: (artist: Artist) => void;
  onBulkStatusChange: (ids: string[], status: ArtistStatus) => void;
};

export function KanbanBoard({
  artists,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
}: KanbanBoardProps) {
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const anchorIdRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const boardArtists = artists.filter(
    (a) => a.status === "in_process" || a.status === "signed",
  );

  const grouped = MAIN_BOARD_STATUSES.map((status) => ({
    status,
    meta: STATUS_META[status],
    items: boardArtists.filter((a) => a.status === status),
  }));

  const handleSelect = useCallback(
    (columnArtists: Artist[], artist: Artist, event: MouseEvent) => {
      if (event.shiftKey && anchorIdRef.current) {
        onSetSelection(selectRangeInColumn(columnArtists, anchorIdRef.current, artist.id));
        return;
      }
      onToggleSelect(artist.id);
      anchorIdRef.current = artist.id;
    },
    [onSetSelection, onToggleSelect],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const artist = event.active.data.current?.artist as Artist | undefined;
    if (artist) setActiveArtist(artist);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveArtist(null);
    const { active, over } = event;
    if (!over) return;

    const targetStatus = over.id as ArtistStatus;
    if (!MAIN_BOARD_STATUSES.includes(targetStatus)) return;

    const artist = active.data.current?.artist as Artist | undefined;
    if (!artist || artist.status === targetStatus) return;

    const dragIds = selectedIds.has(artist.id) ? [...selectedIds] : [artist.id];
    onBulkStatusChange([...new Set(dragIds)], targetStatus);
  };

  const handleSelectAllInCol = (status: ArtistStatus, checked: boolean) => {
    const colArtists = boardArtists.filter((a) => a.status === status);
    if (checked) {
      onSetSelection([...new Set([...selectedIds, ...colArtists.map((a) => a.id)])]);
    } else {
      const colIds = new Set(colArtists.map((a) => a.id));
      onSetSelection([...selectedIds].filter((id) => !colIds.has(id)));
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex min-h-0 flex-1 gap-4">
        {grouped.map(({ status, meta, items }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={meta.label}
            artists={items}
            selectedIds={selectedIds}
            onSelectArtist={(artist, event) => handleSelect(items, artist, event)}
            onOpenDetail={onOpenDetail}
            onSelectAll={(checked) => handleSelectAllInCol(status, checked)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeArtist ? (
          <div className="w-[280px] rotate-1 opacity-95">
            <ArtistCard
              artist={activeArtist}
              selected={selectedIds.has(activeArtist.id)}
              onSelect={() => {}}
              onOpenDetail={() => {}}
              draggable={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
