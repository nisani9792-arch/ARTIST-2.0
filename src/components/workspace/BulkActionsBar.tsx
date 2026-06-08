"use client";

import { useState } from "react";
import type { KanbanColumnId } from "./kanban/constants";

type BulkActionsBarProps = {
  selectedCount: number;
  handlers: string[];
  onApplyStatus: (status: KanbanColumnId) => void;
  onApplyHandler: (handler: string) => void;
  onClearSelection: () => void;
};

export function BulkActionsBar({
  selectedCount,
  handlers,
  onApplyStatus,
  onApplyHandler,
  onClearSelection,
}: BulkActionsBarProps) {
  const [bulkStatus, setBulkStatus] = useState<KanbanColumnId>("unsigned");
  const [bulkHandler, setBulkHandler] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar" role="toolbar" aria-label="פעולות מרובות">
      <span className="bulk-bar__count">{selectedCount.toLocaleString("he-IL")} נבחרו</span>

      <select
        className="bulk-bar__select"
        value={bulkStatus}
        onChange={(e) => setBulkStatus(e.target.value as KanbanColumnId)}
        aria-label="סטטוס מרוכז"
      >
        <option value="unsigned">לא חתום</option>
        <option value="signed">חתום</option>
      </select>

      <button
        type="button"
        className="bulk-bar__btn bulk-bar__btn--primary"
        onClick={() => onApplyStatus(bulkStatus)}
      >
        עדכון סטטוס
      </button>

      <input
        className="bulk-bar__input"
        placeholder="גורם מטפל חדש"
        list="bulk-handlers-list"
        value={bulkHandler}
        onChange={(e) => setBulkHandler(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && bulkHandler.trim()) {
            onApplyHandler(bulkHandler.trim());
            setBulkHandler("");
          }
        }}
      />
      <datalist id="bulk-handlers-list">
        {handlers.map((handler) => (
          <option key={handler} value={handler} />
        ))}
      </datalist>

      <button
        type="button"
        className="bulk-bar__btn bulk-bar__btn--primary"
        disabled={!bulkHandler.trim()}
        onClick={() => {
          onApplyHandler(bulkHandler.trim());
          setBulkHandler("");
        }}
      >
        עדכון מטפל
      </button>

      <button type="button" className="bulk-bar__btn" onClick={onClearSelection}>
        נקה בחירה
      </button>
    </div>
  );
}
