"use client";

import { useEffect, useState } from "react";
import { formatHebrewDateTime, statusLabel } from "@/lib/format";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";

type ArtistDetailPanelProps = {
  artist: Artist | null;
  onClose: () => void;
  onSave: (
    patch: Partial<Pick<Artist, "name" | "handlerName" | "status" | "isOdooApproved">>,
  ) => Promise<void>;
};

export function ArtistDetailPanel({ artist, onClose, onSave }: ArtistDetailPanelProps) {
  const [name, setName] = useState("");
  const [handler, setHandler] = useState("");
  const [status, setStatus] = useState<ArtistStatus>("unsigned");
  const [isOdooApproved, setIsOdooApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!artist) return;
    setName(artist.name);
    setHandler(artist.handlerName);
    setStatus(artist.status);
    setIsOdooApproved(artist.isOdooApproved);
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
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="flex w-full max-w-md flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`פרטי אומן — ${artist.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="truncate text-lg font-extrabold text-slate-900">{artist.name}</h2>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-2.5 py-1 text-sm font-bold text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            aria-label="סגור"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-4 px-5 py-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500">שם אומן</span>
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500">גורם מטפל</span>
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500">סטטוס</span>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as ArtistStatus)}
            >
              {(Object.keys(STATUS_META) as ArtistStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 accent-emerald-600"
              checked={isOdooApproved}
              onChange={(e) => setIsOdooApproved(e.target.checked)}
            />
            <span>מאושר באודו</span>
          </label>

          <p className="text-xs text-gray-500">
            סטטוס נוכחי: {statusLabel(status)} · עודכן{" "}
            {formatHebrewDateTime(artist.lastActionTimestamp)}
          </p>
        </div>

        <footer className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
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
