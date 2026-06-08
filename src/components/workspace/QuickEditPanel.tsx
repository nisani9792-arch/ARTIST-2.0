"use client";

import { useEffect, useMemo, useState } from "react";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

type QuickEditPanelProps = {
  artist: Artist | null;
  handlers: string[];
  onSave: (
    id: string,
    patch: Partial<Pick<Artist, "handlerName" | "status" | "isOdooApproved" | "songCount">>,
  ) => void;
};

export function QuickEditPanel({ artist, handlers, onSave }: QuickEditPanelProps) {
  const quickEditId = useUiStore((s) => s.quickEditArtistId);
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId);

  const [handler, setHandler] = useState("");
  const [status, setStatus] = useState<ArtistStatus>("unsigned");
  const [isOdooApproved, setIsOdooApproved] = useState(false);
  const [songCount, setSongCount] = useState("0");

  const handlerOptions = useMemo(
    () => handlers.map((h) => ({ value: h, label: h })),
    [handlers],
  );
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
    setHandler(artist.handlerName);
    setStatus(artist.status);
    setIsOdooApproved(artist.isOdooApproved);
    setSongCount(String(artist.songCount ?? 0));
  }, [artist]);

  if (!artist || quickEditId !== artist.id) return null;

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm xl:flex">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-xs font-extrabold text-slate-900">{artist.name}</h3>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
          onClick={() => setQuickEditArtistId(null)}
        >
          ✕
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-500">מטפל</span>
        <SelectMenu
          value={handler}
          options={handlerOptions}
          onChange={setHandler}
          label="מטפל"
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

      <label className="flex items-center gap-2 text-[10px] font-medium text-slate-700">
        <input
          type="checkbox"
          className="size-3.5 rounded border-slate-300 accent-emerald-600"
          checked={isOdooApproved}
          onChange={(e) => setIsOdooApproved(e.target.checked)}
        />
        מאושר באודו
      </label>

      <button
        type="button"
        className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-700"
        onClick={() =>
          onSave(artist.id, {
            handlerName: handler,
            status,
            isOdooApproved,
            songCount: Math.max(0, Number.parseInt(songCount, 10) || 0),
          })
        }
      >
        שמור
      </button>
    </aside>
  );
}
