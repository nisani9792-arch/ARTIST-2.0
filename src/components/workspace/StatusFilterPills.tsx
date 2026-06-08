"use client";

import { cn } from "@/lib/cn";
import type { ArtistStats } from "@/lib/types";
import { useUiStore } from "@/stores";

const PILLS = [
  { id: "all" as const, label: "כולם" },
  { id: "signed" as const, label: "חתומים" },
  { id: "in_process" as const, label: "בעבודה" },
  { id: "unsigned" as const, label: "לא חתומים" },
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
    <div className="flex flex-wrap gap-2" role="group" aria-label="סינון סטטוס">
      {PILLS.map((pill) => {
        const isActive = active === pill.id;
        return (
          <button
            key={pill.id}
            type="button"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700",
            )}
            onClick={() => setStatusFilter(isActive ? "all" : pill.id)}
          >
            {pill.label}
            {countFor(pill.id) != null && (
              <span className="ms-1 opacity-80">
                ({countFor(pill.id)!.toLocaleString("he-IL")})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
