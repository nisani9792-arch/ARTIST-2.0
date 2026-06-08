"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import type { Artist } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { KANBAN_COLUMNS, type KanbanColumnId } from "./constants";
import { groupArtistsByColumn, parseDragIdPayload, selectRangeInColumn } from "./selection";

type KanbanBoardProps = {
  artists: Artist[];
  stuckIds: Set<string>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onOpenDetail: (artist: Artist) => void;
  onBulkStatusChange: (ids: string[], columnId: KanbanColumnId) => void;
};

export function KanbanBoard({
  artists,
  stuckIds,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
}: KanbanBoardProps) {
  const [dropTarget, setDropTarget] = useState<KanbanColumnId | null>(null);
  const anchorIdRef = useRef<string | null>(null);

  const grouped = groupArtistsByColumn(artists, stuckIds);
  const counts = {
    total: artists.length,
    unsigned: grouped.unsigned.length,
    stuck: grouped.stuck.length,
    signed: grouped.signed.length,
  };

  const handleSelect = useCallback(
    (columnArtists: Artist[], artist: Artist, event: React.MouseEvent) => {
      if (event.shiftKey && anchorIdRef.current) {
        const range = selectRangeInColumn(columnArtists, anchorIdRef.current, artist.id);
        onSetSelection(range);
        return;
      }
      onToggleSelect(artist.id);
      anchorIdRef.current = artist.id;
    },
    [onSetSelection, onToggleSelect],
  );

  const handleDrop = (event: DragEvent, columnId: KanbanColumnId) => {
    event.preventDefault();
    setDropTarget(null);
    const ids = parseDragIdPayload(event.dataTransfer);
    if (ids.length === 0) return;
    onBulkStatusChange([...new Set(ids)], columnId);
  };

  return (
    <div className="kanban-board">
      <div className="kanban-board__stats">
        <span className="kanban-stat">
          סה״כ <strong>{counts.total.toLocaleString("he-IL")}</strong>
        </span>
        <span className="kanban-stat kanban-stat--unsigned">
          לא חתום <strong>{counts.unsigned.toLocaleString("he-IL")}</strong>
        </span>
        <span className="kanban-stat kanban-stat--stuck">
          תקוע <strong>{counts.stuck.toLocaleString("he-IL")}</strong>
        </span>
        <span className="kanban-stat kanban-stat--signed">
          חתום <strong>{counts.signed.toLocaleString("he-IL")}</strong>
        </span>
        {selectedIds.size > 0 && (
          <span className="kanban-stat kanban-stat--selected">
            נבחרו <strong>{selectedIds.size}</strong> · גרור לעמודה או השתמש בסרגל למטה
          </span>
        )}
      </div>

      <div className="kanban-board__grid">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            tone={col.tone}
            artists={grouped[col.id]}
            selectedIds={selectedIds}
            dragOver={dropTarget === col.id}
            onSelectArtist={(artist, event) => handleSelect(grouped[col.id], artist, event)}
            onOpenDetail={onOpenDetail}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget(col.id);
            }}
            onDragLeave={() => setDropTarget((current) => (current === col.id ? null : current))}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
