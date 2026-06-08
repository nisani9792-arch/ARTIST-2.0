"use client";

import { useState } from "react";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { cn } from "@/lib/cn";
import type { ArtistStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

type BulkActionsBarProps = {
  selectedCount: number;
  handlers: string[];
  onApplyStatus: (status: ArtistStatus) => void;
  onApplyHandler: (handler: string) => void;
  onApplyOdoo: (approved: boolean) => void;
  onApplySongCount: (count: number) => void;
  onClearSelection: () => void;
};

const statusOptions = (Object.keys(STATUS_META) as ArtistStatus[]).map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));

export function BulkActionsBar({
  selectedCount,
  handlers,
  onApplyStatus,
  onApplyHandler,
  onApplyOdoo,
  onApplySongCount,
  onClearSelection,
}: BulkActionsBarProps) {
  const [bulkStatus, setBulkStatus] = useState<ArtistStatus>("unsigned");
  const [bulkHandler, setBulkHandler] = useState("");
  const [songCount, setSongCount] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (selectedCount === 0) return null;

  const applySongCount = () => {
    const n = Number.parseInt(songCount, 10);
    if (Number.isNaN(n) || n < 0) return;
    onApplySongCount(n);
    setSongCount("");
  };

  const panel = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700">
          {selectedCount.toLocaleString("he-IL")} נבחרו
        </span>
        <button
          type="button"
          className="ms-auto rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 md:hidden"
          onClick={() => setExpanded(false)}
        >
          סגור
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-2">
          <SelectMenu
            value={bulkStatus}
            options={statusOptions}
            onChange={(v) => setBulkStatus(v as ArtistStatus)}
            label="סטטוס מרוכז"
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            className="shrink-0 rounded-full bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700"
            onClick={() => onApplyStatus(bulkStatus)}
          >
            עדכן
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="גורם מטפל"
            list="bulk-handlers-list"
            value={bulkHandler}
            onChange={(e) => setBulkHandler(e.target.value)}
          />
          <button
            type="button"
            className="shrink-0 rounded-full bg-cyan-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-cyan-700 disabled:opacity-40"
            disabled={!bulkHandler.trim()}
            onClick={() => {
              onApplyHandler(bulkHandler.trim());
              setBulkHandler("");
            }}
          >
            מטפל
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="flex-1 rounded-full bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700"
            onClick={() => onApplyOdoo(true)}
          >
            ✓ אשר Odoo
          </button>
          <button
            type="button"
            className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
            onClick={() => onApplyOdoo(false)}
          >
            ✗ בטל Odoo
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="כמות שירים"
            value={songCount}
            onChange={(e) => setSongCount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySongCount()}
          />
          <button
            type="button"
            className="shrink-0 rounded-full bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700 disabled:opacity-40"
            disabled={songCount.trim() === ""}
            onClick={applySongCount}
          >
            שירים
          </button>
        </div>
      </div>

      <datalist id="bulk-handlers-list">
        {handlers.map((handler) => (
          <option key={handler} value={handler} />
        ))}
      </datalist>

      <button
        type="button"
        className="w-full rounded-full border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        onClick={onClearSelection}
      >
        נקה בחירה
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile: collapsed chip */}
      <button
        type="button"
        className={cn(
          "fixed bottom-4 inset-x-4 z-50 mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg md:hidden",
          expanded && "hidden",
        )}
        onClick={() => setExpanded(true)}
      >
        {selectedCount.toLocaleString("he-IL")} נבחרו — פעולות ▲
      </button>

      {/* Mobile: expanded sheet */}
      {expanded && (
        <div className="fixed inset-0 z-[55] md:hidden" role="presentation">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl">
            {panel}
          </div>
        </div>
      )}

      {/* Desktop: inline bar */}
      <div
        className="fixed bottom-4 inset-x-4 z-50 mx-auto hidden max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md md:block"
        role="toolbar"
        aria-label="פעולות מרובות"
      >
        {panel}
      </div>
    </>
  );
}
