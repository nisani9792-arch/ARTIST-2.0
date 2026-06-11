"use client";

import { useCallback, useState } from "react";
import type { DuplicateGroup } from "@/lib/artists";
import { STATUS_META } from "@/lib/types";

type DuplicatesPanelProps = {
  onMerged?: () => void;
};

export function DuplicatesPanel({ onMerged }: DuplicatesPanelProps) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);

  const duplicateCount = groups.reduce((sum, g) => sum + g.artists.length - 1, 0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/artists/duplicates");
      if (!res.ok) throw new Error("סריקה נכשלה");
      const data = (await res.json()) as { groups: DuplicateGroup[] };
      setGroups(data.groups);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void refresh();
  };

  const handleMerge = async (keepId: string, removeIds: string[], name: string) => {
    if (
      !window.confirm(
        `למזג ${removeIds.length} כפילויות ל"${name}"?\nהרשומות הכפולות יועברו לסל המחזור.`,
      )
    ) {
      return;
    }
    setMerging(true);
    try {
      const res = await fetch("/api/artists/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepId, removeIds }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "מיזוג נכשל");
      await refresh();
      onMerged?.();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "מיזוג נכשל");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-800 shadow-sm hover:border-amber-300"
        onClick={handleToggle}
        aria-expanded={open}
      >
        כפילויות{duplicateCount > 0 ? ` (${duplicateCount})` : ""}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-extrabold text-slate-800">כפילויות שמות</h3>
            <button
              type="button"
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
              onClick={() => void refresh()}
              disabled={loading}
            >
              {loading ? "סורק…" : "רענן"}
            </button>
          </div>

          {loading ? (
            <p className="py-4 text-center text-[10px] text-slate-500">סורק כפילויות…</p>
          ) : groups.length === 0 ? (
            <p className="py-4 text-center text-[10px] text-slate-500">לא נמצאו כפילויות</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {groups.map((group) => {
                const keep = group.artists[0];
                const removeIds = group.artists.slice(1).map((a) => a.id);
                return (
                  <li
                    key={group.key}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-2"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <strong className="text-[11px] text-slate-800">{group.name}</strong>
                      <span className="text-[10px] text-slate-500">{group.artists.length} רשומות</span>
                    </div>
                    <ul className="mb-2 space-y-0.5 text-[10px] text-slate-600">
                      {group.artists.map((artist, index) => (
                        <li key={artist.id} className="flex items-center gap-2">
                          <span>{index === 0 ? "★" : "·"}</span>
                          <span className="truncate">{artist.name}</span>
                          <span className="rounded bg-white px-1 text-[9px] font-bold text-slate-500">
                            {STATUS_META[artist.status].label}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="w-full rounded-lg bg-amber-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                      disabled={merging || removeIds.length === 0}
                      onClick={() => void handleMerge(keep.id, removeIds, keep.name)}
                    >
                      מזג כפילויות
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-2 text-[9px] leading-snug text-slate-400">
            פקודה: &quot;מצא כפילויות&quot; בתפריט הפקודות
          </p>
        </div>
      )}
    </div>
  );
}
