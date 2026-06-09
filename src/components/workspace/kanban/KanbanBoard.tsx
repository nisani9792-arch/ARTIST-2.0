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
import { cn } from "@/lib/cn";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore, type BoardColumnStatus } from "@/stores/useUiStore";
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
  onContextMenu?: (artist: Artist, event: MouseEvent) => void;
  hideBoard?: boolean;
};

const isBoardColumn = (status: ArtistStatus): status is BoardColumnStatus =>
  status === "in_process" || status === "signed";

export function KanbanBoard({
  artists,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
  onContextMenu,
  hideBoard = false,
}: KanbanBoardProps) {
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumnStatus | null>(null);
  const anchorIdRef = useRef<string | null>(null);

  const columnOrder = useUiStore((s) => s.columnOrder);
  const mobileBoardTab = useUiStore((s) => s.mobileBoardTab);
  const setMobileBoardTab = useUiStore((s) => s.setMobileBoardTab);
  const setColumnOrder = useUiStore((s) => s.setColumnOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const boardArtists = artists.filter(
    (a) => a.status === "in_process" || a.status === "signed",
  );

  const grouped = columnOrder.map((status) => ({
    status,
    meta: STATUS_META[status],
    items: boardArtists.filter((a) => a.status === status),
  }));

  const mobileColumn = grouped.find((g) => g.status === mobileBoardTab) ?? grouped[0];

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
    const type = event.active.data.current?.type as string | undefined;
    if (type === "column-reorder") {
      setActiveColumn(event.active.data.current?.status as BoardColumnStatus);
      return;
    }
    const artist = event.active.data.current?.artist as Artist | undefined;
    if (artist) setActiveArtist(artist);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveArtist(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type as string | undefined;

    if (activeType === "column-reorder") {
      const from = active.data.current?.status as BoardColumnStatus | undefined;
      const overType = over.data.current?.type as string | undefined;
      if (!from || overType !== "column-reorder") return;
      const to = over.data.current?.status as BoardColumnStatus | undefined;
      if (!to || from === to) return;

      const order = [...columnOrder];
      const fromIdx = order.indexOf(from);
      const toIdx = order.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, from);
      setColumnOrder(order);
      return;
    }

    const targetStatus = over.id as ArtistStatus;
    if (!isBoardColumn(targetStatus)) return;

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

  const renderColumn = (
    status: BoardColumnStatus,
    label: string,
    items: Artist[],
    desktop: boolean,
    hideHeader?: boolean,
  ) => (
    <KanbanColumn
      key={`${status}-${desktop ? "d" : "m"}`}
      status={status}
      label={label}
      artists={items}
      selectedIds={selectedIds}
      desktop={desktop}
      hideHeader={hideHeader}
      onSelectArtist={(artist, event) => handleSelect(items, artist, event)}
      onOpenDetail={onOpenDetail}
      onContextMenu={onContextMenu}
      onSelectAll={(checked) => handleSelectAllInCol(status, checked)}
    />
  );

  if (hideBoard) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <p className="text-sm font-bold text-slate-700">כל האומנים ב-Vault</p>
        <p className="text-xs text-gray-500">פתח את ה-Vault מהתפריט התחתון לצפייה ועריכה</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex min-h-0 flex-1 flex-col">
      {/* Mobile tabs */}
      <div className="mb-2 flex shrink-0 gap-2 lg:hidden" role="tablist">
        {grouped.map(({ status, meta, items }) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={mobileBoardTab === status}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-bold transition",
              mobileBoardTab === status
                ? status === "signed"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-amber-500 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600",
            )}
            onClick={() => setMobileBoardTab(status)}
          >
            {meta.label} ({items.length.toLocaleString("he-IL")})
          </button>
        ))}
      </div>

      {/* Mobile: single column */}
      <div className="flex min-h-0 flex-1 lg:hidden">
        {mobileColumn &&
          renderColumn(
            mobileColumn.status,
            mobileColumn.meta.label,
            mobileColumn.items,
            false,
          )}
      </div>

      </div>

      <DragOverlay dropAnimation={null}>
        {activeArtist ? (
          <div className="w-[240px] rotate-1 opacity-95">
            <ArtistCard
              artist={activeArtist}
              selected={selectedIds.has(activeArtist.id)}
              onSelect={() => {}}
              onOpenDetail={() => {}}
              draggable={false}
            />
          </div>
        ) : null}
        {activeColumn ? (
          <div className="rounded-2xl border border-blue-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-lg">
            {STATUS_META[activeColumn].label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
