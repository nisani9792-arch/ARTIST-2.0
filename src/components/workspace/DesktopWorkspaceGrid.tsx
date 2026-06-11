"use client";

import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { Fragment, useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  artistMatchesColumn,
  BOARD_COLUMN_META,
  filterArtistsForColumn,
  type BoardColumnId,
} from "@/lib/board-columns";
import { boardCollisionDetection, resolveBoardDropColumn } from "@/lib/kanban-dnd";
import { useBoardSensors } from "@/lib/useBoardSensors";
import { ColumnResizeHandle } from "./kanban/ColumnResizeHandle";
import { KanbanColumn } from "./kanban/KanbanColumn";
import { BoardArtistCard } from "./kanban/BoardArtistCard";
import { UnsignedVault } from "./UnsignedVault";
import type { Artist } from "@/lib/types";
import { useUiStore } from "@/stores/useUiStore";
import { selectRangeInColumn } from "./kanban/selection";

type DesktopWorkspaceGridProps = {
  artists: Artist[];
  vaultArtists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onOpenDetail: (artist: Artist) => void;
  onBulkColumnChange: (ids: string[], columnId: BoardColumnId) => void;
  onExportColumn?: (columnId: BoardColumnId) => void;
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
  onBulkColumnChange,
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

  const sensors = useBoardSensors();

  const boardArtists = artists.filter(
    (a) => a.status === "in_process" || a.status === "signed",
  );

  const grouped = columnOrder.map((columnId) => ({
    columnId,
    meta: BOARD_COLUMN_META[columnId],
    items: filterArtistsForColumn(boardArtists, columnId),
  }));

  const boardTotal = columnOrder.reduce((sum, id) => sum + columnWidths[id], 0);
  const boardColParts = grouped.flatMap((col, index) => {
    const fr = ((columnWidths[col.columnId] / boardTotal) * 100).toFixed(3);
    return index === 0 ? [`${fr}fr`] : ["4px", `${fr}fr`];
  });

  const gridCols = hideBoard
    ? vaultOpen
      ? "1fr"
      : "28px"
    : vaultOpen
      ? [`${vaultWidthPct}fr`, "4px", ...boardColParts].join(" ")
      : ["28px", ...boardColParts].join(" ");

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

  const handleSelectAllInCol = (visibleArtists: Artist[], checked: boolean) => {
    const visibleIds = new Set(visibleArtists.map((a) => a.id));
    if (checked) {
      onSetSelection([...new Set([...selectedIds, ...visibleIds])]);
    } else {
      onSetSelection([...selectedIds].filter((id) => !visibleIds.has(id)));
    }
  };

  const handleResizeBoard = (left: BoardColumnId, right: BoardColumnId, deltaPx: number) => {
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
    const targetColumn = resolveBoardDropColumn(event);
    if (!targetColumn) return;

    const artist = event.active.data.current?.artist as Artist | undefined;
    if (!artist || artistMatchesColumn(artist, targetColumn)) return;

    const dragIds = selectedIds.has(artist.id) ? [...selectedIds] : [artist.id];
    onBulkColumnChange([...new Set(dragIds)], targetColumn);
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
                  draggable
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

          {!hideBoard &&
            grouped.map((col, index) => (
              <Fragment key={col.columnId}>
                {index > 0 && (
                  <ColumnResizeHandle
                    onResize={(deltaPx) =>
                      handleResizeBoard(grouped[index - 1].columnId, col.columnId, deltaPx)
                    }
                  />
                )}
                <KanbanColumn
                  columnId={col.columnId}
                  artists={col.items}
                  selectedIds={selectedIds}
                  desktop
                  onExportColumn={onExportColumn}
                  onSelectArtist={(artist, event) => handleSelect(col.items, artist, event)}
                  onOpenDetail={onOpenDetail}
                  onContextMenu={onContextMenu}
                  onSelectAll={(checked, visible) => handleSelectAllInCol(visible, checked)}
                />
              </Fragment>
            ))}
        </div>

        {quickEditSlot}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeArtist ? (
          activeArtist.status === "unsigned" ? (
            <div className="max-w-[220px] rotate-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xl opacity-95">
              {activeArtist.name}
            </div>
          ) : (
            <div className="w-[300px] rotate-1 opacity-95">
              <BoardArtistCard
                artist={activeArtist}
                selected={selectedIds.has(activeArtist.id)}
                onSelect={() => {}}
                onOpenDetail={() => {}}
                draggable={false}
              />
            </div>
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
