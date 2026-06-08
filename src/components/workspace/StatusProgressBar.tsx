"use client";

import type { ArtistStats } from "@/lib/types";

export function StatusProgressBar({ stats }: { stats?: ArtistStats | null }) {
  const total = stats?.total ?? 0;
  if (total === 0) return null;

  const signed = stats?.signed ?? 0;
  const inProcess = stats?.in_process ?? 0;
  const unsigned = stats?.unsigned ?? 0;

  const signedPct = (signed / total) * 100;
  const inProcessPct = (inProcess / total) * 100;
  const unsignedPct = (unsigned / total) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-slate-200 shadow-inner"
        aria-label="התקדמות חתימות"
      >
        <div className="bg-emerald-500 transition-all" style={{ width: `${signedPct}%` }} />
        <div className="bg-amber-400 transition-all" style={{ width: `${inProcessPct}%` }} />
        <div className="bg-slate-400 transition-all" style={{ width: `${unsignedPct}%` }} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
          <span className="font-bold text-emerald-700">{signed.toLocaleString("he-IL")}</span>
          חתומים
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-400" aria-hidden />
          <span className="font-bold text-amber-700">{inProcess.toLocaleString("he-IL")}</span>
          בעבודה
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-slate-400" aria-hidden />
          <span className="font-bold text-slate-600">{unsigned.toLocaleString("he-IL")}</span>
          לא חתומים
        </span>
        <span className="ms-auto font-bold text-slate-700">
          {total.toLocaleString("he-IL")} סה״כ
        </span>
      </div>
    </div>
  );
}
