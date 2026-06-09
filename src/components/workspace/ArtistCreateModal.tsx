"use client";

import { useEffect, useMemo, useState } from "react";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { formatHebrewDateTime } from "@/lib/format";
import { DEFAULT_HANDLER, STATUS_META, type ArtistStatus } from "@/lib/types";
import type { CreateArtistInput } from "@/hooks/useArtists";

type ArtistCreateModalProps = {
  open: boolean;
  operatorName?: string | null;
  handlers: string[];
  onClose: () => void;
  onCreate: (input: CreateArtistInput) => Promise<void>;
};

export function ArtistCreateModal({
  open,
  operatorName,
  handlers,
  onClose,
  onCreate,
}: ArtistCreateModalProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ArtistStatus>("unsigned");
  const [handler, setHandler] = useState("");
  const [isOdooApproved, setIsOdooApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  const statusOptions = useMemo(
    () =>
      (Object.keys(STATUS_META) as ArtistStatus[]).map((s) => ({
        value: s,
        label: STATUS_META[s].label,
      })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setName("");
    setStatus("unsigned");
    setHandler(operatorName || DEFAULT_HANDLER);
    setIsOdooApproved(false);
  }, [open, operatorName]);

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onCreate({
        name: trimmed,
        status,
        handlerName: handler.trim() || DEFAULT_HANDLER,
        isOdooApproved,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="אומן חדש"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-extrabold text-slate-900">אומן חדש</h2>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500">שם אומן *</span>
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500">סטטוס</span>
            <SelectMenu
              value={status}
              options={statusOptions}
              onChange={(v) => setStatus(v as ArtistStatus)}
              label="סטטוס"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500">גורם מטפל</span>
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              list="create-handlers-list"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
            />
            <datalist id="create-handlers-list">
              {handlers.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 accent-emerald-600"
              checked={isOdooApproved}
              onChange={(e) => setIsOdooApproved(e.target.checked)}
            />
            <span>מאושר באודו (חומרים)</span>
          </label>

          <p className="text-[10px] text-gray-500">
            תאריך שינוי אחרון: {formatHebrewDateTime(new Date().toISOString())} (ייווצר עכשיו)
          </p>
        </div>

        <footer className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            disabled={busy || !name.trim()}
            onClick={() => void handleSubmit()}
          >
            {busy ? "יוצר…" : "צור אומן"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
