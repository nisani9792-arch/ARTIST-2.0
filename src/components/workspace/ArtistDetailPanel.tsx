"use client";

import { useEffect, useMemo, useState } from "react";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { formatHebrewDateTime, statusLabel } from "@/lib/format";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";

type ArtistDetailPanelProps = {
  artist: Artist | null;
  onClose: () => void;
  onSave: (
    patch: Partial<
      Pick<Artist, "name" | "handlerName" | "status" | "isOdooApproved" | "songCount">
    >,
  ) => Promise<void>;
};

export function ArtistDetailPanel({ artist, onClose, onSave }: ArtistDetailPanelProps) {
  const [name, setName] = useState("");
  const [handler, setHandler] = useState("");
  const [status, setStatus] = useState<ArtistStatus>("unsigned");
  const [isOdooApproved, setIsOdooApproved] = useState(false);
  const [songCount, setSongCount] = useState("0");
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
    if (!artist) return;
    setName(artist.name);
    setHandler(artist.handlerName);
    setStatus(artist.status);
    setIsOdooApproved(artist.isOdooApproved);
    setSongCount(String(artist.songCount ?? 0));
  }, [artist]);

  if (!artist) return null;

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        handlerName: handler.trim(),
        status,
        isOdooApproved,
        songCount: Math.max(0, Number.parseInt(songCount, 10) || 0),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label={`פרטי אומן — ${artist.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="truncate text-sm font-extrabold text-slate-900">{artist.name}</h2>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            aria-label="סגור"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500">שם אומן</span>
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500">גורם מטפל</span>
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
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
            <span className="text-[10px] font-bold text-gray-500">כמות שירים</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={songCount}
              onChange={(e) => setSongCount(e.target.value)}
            />
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 accent-emerald-600"
              checked={isOdooApproved}
              onChange={(e) => setIsOdooApproved(e.target.checked)}
            />
            <span>מאושר באודו</span>
          </label>

          <p className="text-[10px] text-gray-500">
            סטטוס נוכחי: {statusLabel(status)} · עודכן{" "}
            {formatHebrewDateTime(artist.lastActionTimestamp)}
          </p>
        </div>

        <footer className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            disabled={busy}
            onClick={() => void handleSave()}
          >
            {busy ? "שומר…" : "שמור"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
