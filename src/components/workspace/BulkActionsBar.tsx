"use client";

import { useState } from "react";
import type { ArtistStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

type BulkActionsBarProps = {
  selectedCount: number;
  handlers: string[];
  onApplyStatus: (status: ArtistStatus) => void;
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
  const [bulkStatus, setBulkStatus] = useState<ArtistStatus>("unsigned");
  const [bulkHandler, setBulkHandler] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar" role="toolbar" aria-label="פעולות מרובות">
      <span className="bulk-bar__count">{selectedCount.toLocaleString("he-IL")} נבחרו</span>

      <select
        className="bulk-bar__select"
        value={bulkStatus}
        onChange={(e) => setBulkStatus(e.target.value as ArtistStatus)}
        aria-label="סטטוס מרוכז"
      >
        {(Object.keys(STATUS_META) as ArtistStatus[]).map((status) => (
          <option key={status} value={status}>
            {STATUS_META[status].label}
          </option>
        ))}
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
