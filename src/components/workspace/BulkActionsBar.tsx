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
    <div
      className="fixed bottom-4 start-1/2 z-50 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md"
      role="toolbar"
      aria-label="פעולות מרובות"
    >
      <span className="text-xs font-bold text-slate-700">
        {selectedCount.toLocaleString("he-IL")} נבחרו
      </span>

      <select
        className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
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
        className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
        onClick={() => onApplyStatus(bulkStatus)}
      >
        עדכון סטטוס
      </button>

      <input
        className="w-36 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
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
        className="rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-40"
        disabled={!bulkHandler.trim()}
        onClick={() => {
          onApplyHandler(bulkHandler.trim());
          setBulkHandler("");
        }}
      >
        עדכון מטפל
      </button>

      <button
        type="button"
        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        onClick={onClearSelection}
      >
        נקה בחירה
      </button>
    </div>
  );
}
