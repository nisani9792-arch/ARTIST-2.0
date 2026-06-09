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

const odooOptions = [
  { value: "unchanged", label: "ללא שינוי Odoo" },
  { value: "approve", label: "אשר Odoo" },
  { value: "revoke", label: "בטל Odoo" },
] as const;

type OdooChoice = (typeof odooOptions)[number]["value"];

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
  const [bulkOdoo, setBulkOdoo] = useState<OdooChoice>("unchanged");
  const [songCount, setSongCount] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (selectedCount === 0) return null;

  const applySongCount = () => {
    const n = Number.parseInt(songCount, 10);
    if (Number.isNaN(n) || n < 0) return;
    onApplySongCount(n);
    setSongCount("");
  };

  const applyOdoo = (approved: boolean) => {
    if (selectedCount > 10) {
      const verb = approved ? "לאשר Odoo" : "לבטל Odoo";
      const ok = window.confirm(`${verb} עבור ${selectedCount} אומנים?`);
      if (!ok) return;
    }
    onApplyOdoo(approved);
    setBulkOdoo("unchanged");
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

        <div className="flex min-w-0 items-center gap-2 sm:col-span-2">
          <SelectMenu
            value={bulkOdoo}
            options={odooOptions.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(v) => setBulkOdoo(v as OdooChoice)}
            label="סטטוס Odoo"
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            className="shrink-0 rounded-full bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
            disabled={bulkOdoo === "unchanged"}
            onClick={() => {
              if (bulkOdoo === "approve") applyOdoo(true);
              else if (bulkOdoo === "revoke") applyOdoo(false);
            }}
          >
            Odoo
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

  const bottomOffset = "bottom-[calc(3.5rem+var(--safe-bottom)+0.5rem)]";

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed inset-x-4 z-[60] mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg md:hidden",
          bottomOffset,
          expanded && "hidden",
        )}
        onClick={() => setExpanded(true)}
      >
        {selectedCount.toLocaleString("he-IL")} נבחרו — פעולות ▲
      </button>

      {expanded && (
        <div className="fixed inset-0 z-[60] md:hidden" role="presentation">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          />
          <div
            className={cn(
              "absolute inset-x-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl",
              bottomOffset,
            )}
          >
            {panel}
          </div>
        </div>
      )}

      <div
        className="fixed inset-x-4 z-[60] mx-auto hidden max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md md:bottom-4 md:block"
        role="toolbar"
        aria-label="פעולות מרובות"
      >
        {panel}
      </div>
    </>
  );
}
