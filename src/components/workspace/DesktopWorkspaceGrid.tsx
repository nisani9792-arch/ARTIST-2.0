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
import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { boardCollisionDetection, resolveBoardDropStatus } from "@/lib/kanban-dnd";
import { ColumnResizeHandle } from "./kanban/ColumnResizeHandle";
import { KanbanColumn } from "./kanban/KanbanColumn";
import { BoardArtistCard } from "./kanban/BoardArtistCard";
import { UnsignedVault } from "./UnsignedVault";
import type { Artist, ArtistStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { useUiStore, type BoardColumnStatus } from "@/stores/useUiStore";
import { selectRangeInColumn } from "./kanban/selection";

type DesktopWorkspaceGridProps = {
  artists: Artist[];
  vaultArtists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onOpenDetail: (artist: Artist) => void;
  onBulkStatusChange: (ids: string[], status: ArtistStatus) => void;
  onExportColumn?: (status: ArtistStatus) => void;
  onContextMenu?: (artist: Artist, event: MouseEvent) => void;
  hideBoard?: boolean;
  quickEditSlot?: ReactNode;
};

export function DesktopWorkspaceGrid({
  artists,
  vaultArtists,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
  onExportColumn,
  onContextMenu,
  hideBoard = false,
  quickEditSlot,
}: DesktopWorkspaceGridProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const anchorIdRef = useRef<string | null>(null);
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);

  const vaultOpen = useUiStore((s) => s.vaultOpen);
  const toggleVault = useUiStore((s) => s.toggleVault);
  const columnOrder = useUiStore((s) => s.columnOrder);
  const columnWidths = useUiStore((s) => s.columnWidths);
  const vaultWidthPct = useUiStore((s) => s.vaultWidthPct);
  const resizeAdjacentColumns = useUiStore((s) => s.resizeAdjacentColumns);
  const resizeVaultWidth = useUiStore((s) => s.resizeVaultWidth);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const boardArtists = artists.filter(
    (a) => a.status === "in_process" || a.status === "signed",
  );

  const grouped = columnOrder.map((status) => ({
    status,
    meta: STATUS_META[status],
    items: boardArtists.filter((a) => a.status === status),
  }));

  const col0 = grouped[0];
  const col1 = grouped[1];
  const boardTotal = columnOrder.reduce((sum, s) => sum + columnWidths[s], 0);
  const col0Fr = col0 ? (columnWidths[col0.status] / boardTotal) * 100 : 50;
  const col1Fr = col1 ? (columnWidths[col1.status] / boardTotal) * 100 : 50;

  const gridCols = hideBoard
    ? vaultOpen
      ? "1fr"
      : "28px"
    : vaultOpen
      ? `${vaultWidthPct}fr 4px ${col0Fr}fr 4px ${col1Fr}fr`
      : `28px ${col0Fr}fr 4px ${col1Fr}fr`;

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

  const handleSelectAllInCol = (status: ArtistStatus, checked: boolean) => {
    const colArtists = boardArtists.filter((a) => a.status === status);
    if (checked) {
      onSetSelection([...new Set([...selectedIds, ...colArtists.map((a) => a.id)])]);
    } else {
      const colIds = new Set(colArtists.map((a) => a.id));
      onSetSelection([...selectedIds].filter((id) => !colIds.has(id)));
    }
  };

  const handleResizeBoard = (left: BoardColumnStatus, right: BoardColumnStatus, deltaPx: number) => {
    const width = boardRef.current?.offsetWidth ?? 1;
    resizeAdjacentColumns(left, right, (deltaPx / width) * 100);
  };

  const handleResizeVault = (deltaPx: number) => {
    const width = boardRef.current?.offsetWidth ?? 1;
    resizeVaultWidth((deltaPx / width) * 100);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const artist = event.active.data.current?.artist as Artist | undefined;
    if (artist) setActiveArtist(artist);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveArtist(null);
    const targetStatus = resolveBoardDropStatus(event);
    if (!targetStatus) return;

    const artist = event.active.data.current?.artist as Artist | undefined;
    if (!artist || artist.status === targetStatus) return;

    const dragIds = selectedIds.has(artist.id) ? [...selectedIds] : [artist.id];
    onBulkStatusChange([...new Set(dragIds)], targetStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="hidden min-h-0 flex-1 lg:flex">
        <div
          ref={boardRef}
          className="grid min-h-0 min-w-0 flex-1 gap-0"
          style={{ gridTemplateColumns: gridCols }}
        >
          {vaultOpen ? (
            <>
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                <UnsignedVault
                  artists={vaultArtists}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onOpenDetail={onOpenDetail}
                  embedded
                />
              </div>
              <ColumnResizeHandle onResize={handleResizeVault} />
            </>
          ) : (
            <button
              type="button"
              className="flex min-h-0 cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 py-2 text-[10px] font-bold text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50/60"
              onClick={toggleVault}
              title="פתח רשימת לא חתומים"
            >
              <span className="[writing-mode:vertical-rl]" style={{ textOrientation: "mixed" }}>
                לא חתומים ({vaultArtists.length})
              </span>
            </button>
          )}

          {!hideBoard && col0 && (
            <KanbanColumn
              status={col0.status}
              label={col0.meta.label}
              artists={col0.items}
              selectedIds={selectedIds}
              desktop
              onExportColumn={onExportColumn}
              onSelectArtist={(artist, event) => handleSelect(col0.items, artist, event)}
              onOpenDetail={onOpenDetail}
              onContextMenu={onContextMenu}
              onSelectAll={(checked) => handleSelectAllInCol(col0.status, checked)}
            />
          )}

          {!hideBoard && col0 && col1 && (
            <ColumnResizeHandle
              onResize={(deltaPx) => handleResizeBoard(col0.status, col1.status, deltaPx)}
            />
          )}

          {!hideBoard && col1 && (
            <KanbanColumn
              status={col1.status}
              label={col1.meta.label}
              artists={col1.items}
              selectedIds={selectedIds}
              desktop
              onExportColumn={onExportColumn}
              onSelectArtist={(artist, event) => handleSelect(col1.items, artist, event)}
              onOpenDetail={onOpenDetail}
              onContextMenu={onContextMenu}
              onSelectAll={(checked) => handleSelectAllInCol(col1.status, checked)}
            />
          )}
        </div>

        {quickEditSlot}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeArtist ? (
          <div className="w-[300px] rotate-1 opacity-95">
            <BoardArtistCard
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
