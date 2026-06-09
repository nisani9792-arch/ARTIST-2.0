"use client";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/stores";

export function ViewModeSwitcher() {
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);

  return (
    <div className="flex rounded-full border border-slate-200 bg-white p-0.5 shadow-sm" role="group">
      {(["kanban", "list"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold transition",
            viewMode === mode ? "bg-blue-600 text-white" : "text-slate-600",
          )}
          onClick={() => setViewMode(mode)}
        >
          {mode === "kanban" ? "קנבן" : "טבלה"}
        </button>
      ))}
    </div>
  );
}
