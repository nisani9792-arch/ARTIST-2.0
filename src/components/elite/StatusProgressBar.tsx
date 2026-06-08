"use client";

import type { ArtistStats } from "@/lib/types";

export function StatusProgressBar({ stats }: { stats?: ArtistStats | null }) {
  const total = stats?.total ?? 0;
  if (total === 0) return null;

  const signedPct = ((stats?.signed ?? 0) / total) * 100;
  const inProcessPct = ((stats?.in_process ?? 0) / total) * 100;
  const unsignedPct = ((stats?.unsigned ?? 0) / total) * 100;

  return (
    <div className="elite-progress" aria-label="התקדמות חתימות">
      <div className="elite-progress-seg elite-progress-seg--signed" style={{ width: `${signedPct}%` }} />
      <div className="elite-progress-seg elite-progress-seg--in-process" style={{ width: `${inProcessPct}%` }} />
      <div className="elite-progress-seg elite-progress-seg--unsigned" style={{ width: `${unsignedPct}%` }} />
    </div>
  );
}
