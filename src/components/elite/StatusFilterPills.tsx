"use client";

import type { ArtistStats } from "@/lib/types";
import { useUiStore } from "@/stores";

const PILLS = [
  { id: "all" as const, label: "כולם", icon: null },
  { id: "signed" as const, label: "חתומים", icon: "✅" },
  { id: "in_process" as const, label: "בעבודה", icon: "⚠️" },
  { id: "unsigned" as const, label: "לא חתומים", icon: "⏳" },
];

export function StatusFilterPills({ stats }: { stats?: ArtistStats | null }) {
  const active = useUiStore((s) => s.statusFilter);
  const setStatusFilter = useUiStore((s) => s.setStatusFilter);

  const countFor = (id: typeof active) => {
    if (!stats) return null;
    if (id === "all") return stats.total;
    return stats[id];
  };

  return (
    <div className="elite-pills" role="group" aria-label="סינון סטטוס">
      {PILLS.map((pill) => (
        <button
          key={pill.id}
          type="button"
          className={`elite-pill ${active === pill.id ? "elite-pill--active" : ""}`}
          onClick={() => setStatusFilter(active === pill.id ? "all" : pill.id)}
        >
          {pill.icon && <span aria-hidden>{pill.icon}</span>}
          {pill.label}
          {countFor(pill.id) != null && (
            <span>({countFor(pill.id)!.toLocaleString("he-IL")})</span>
          )}
        </button>
      ))}
    </div>
  );
}
