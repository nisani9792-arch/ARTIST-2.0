"use client";

import { useEffect, useState } from "react";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

type QuickEditPanelProps = {
  artist: Artist | null;
  handlers: string[];
  onSave: (id: string, patch: Partial<Pick<Artist, "handlerName" | "status" | "isOdooApproved">>) => void;
};

export function QuickEditPanel({ artist, handlers, onSave }: QuickEditPanelProps) {
  const quickEditId = useUiStore((s) => s.quickEditArtistId);
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId);

  const [handler, setHandler] = useState("");
  const [status, setStatus] = useState<ArtistStatus>("unsigned");
  const [isOdooApproved, setIsOdooApproved] = useState(false);

  useEffect(() => {
    if (!artist) return;
    setHandler(artist.handlerName);
    setStatus(artist.status);
    setIsOdooApproved(artist.isOdooApproved);
  }, [artist]);

  if (!artist || quickEditId !== artist.id) return null;

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:flex">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-extrabold text-slate-900">{artist.name}</h3>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
          onClick={() => setQuickEditArtistId(null)}
        >
          ✕
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-gray-500">מטפל</span>
        <select
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={handler}
          onChange={(e) => setHandler(e.target.value)}
        >
          {handlers.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
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

      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300 accent-emerald-600"
          checked={isOdooApproved}
          onChange={(e) => setIsOdooApproved(e.target.checked)}
        />
        מאושר באודו
      </label>

      <button
        type="button"
        className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-cyan-700"
        onClick={() => onSave(artist.id, { handlerName: handler, status, isOdooApproved })}
      >
        שמור
      </button>
    </aside>
  );
}
