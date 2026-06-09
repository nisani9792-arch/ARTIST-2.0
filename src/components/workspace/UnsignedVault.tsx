"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { STATUS_META, type Artist } from "@/lib/types";
import { useUiStore } from "@/stores";

const VAULT_ROW_HEIGHT = 36;

type UnsignedVaultProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (artist: Artist) => void;
  embedded?: boolean;
};

export function UnsignedVault({
  artists,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
  embedded = false,
}: UnsignedVaultProps) {
  const vaultOpen = useUiStore((s) => s.vaultOpen);
  const toggleVault = useUiStore((s) => s.toggleVault);
  const showPanel = embedded || vaultOpen;
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => VAULT_ROW_HEIGHT,
    overscan: 14,
  });

  if (!showPanel) {
    return (
      <aside
        className="hidden w-11 shrink-0 cursor-pointer flex-col items-center rounded-3xl border border-slate-200 bg-slate-50 py-4 transition hover:border-cyan-300 hover:bg-cyan-50/50 lg:flex"
        onClick={toggleVault}
        title="רשימת לא חתומים"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggleVault()}
      >
        <span
          className="text-[10px] font-bold text-slate-500 [writing-mode:vertical-rl]"
          style={{ textOrientation: "mixed" }}
        >
          לא חתומים ({artists.length})
        </span>
      </aside>
    );
  }

  return (
    <>
      {!embedded && (
        <div
          className="fixed inset-0 z-[44] bg-slate-900/50 backdrop-blur-md lg:hidden"
          onClick={toggleVault}
          role="presentation"
        />
      )}
      <aside
        className={cn(
          "flex min-h-0 flex-col gap-2 border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-3",
          embedded
            ? "h-full min-w-0 rounded-2xl shadow-inner"
            : cn(
                "z-[45] shadow-2xl",
                "fixed inset-x-0 bottom-0 max-h-[75dvh] rounded-t-3xl",
                "lg:static lg:max-h-none lg:w-64 lg:shrink-0 lg:rounded-3xl lg:shadow-none",
              ),
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-slate-400" aria-hidden />
            <h2 className="text-xs font-extrabold text-slate-700">לא חתומים</h2>
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-500 shadow-sm">
              {artists.length.toLocaleString("he-IL")}
            </span>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
            onClick={toggleVault}
          >
            סגור
          </button>
        </header>

        <p className="text-[10px] leading-snug text-slate-500">
          רשימה לצפייה מהירה — לחץ פעמיים לפרטים מלאים
        </p>

        <div ref={scrollRef} className="kanban-scroll min-h-0 flex-1 overflow-y-auto">
          {artists.length === 0 ? (
            <p className="py-6 text-center text-[10px] text-gray-500">אין אומנים ברשימה</p>
          ) : (
            <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
              {virtualizer.getVirtualItems().map((row) => {
                const artist = artists[row.index];
                const selected = selectedIds.has(artist.id);
                return (
                  <div
                    key={artist.id}
                    className="absolute start-0 end-0"
                    style={{
                      height: `${row.size}px`,
                      transform: `translateY(${row.start}px)`,
                    }}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition",
                        selected
                          ? "bg-cyan-50 ring-1 ring-cyan-200"
                          : "hover:bg-slate-100/80",
                      )}
                      onClick={() => onToggleSelect(artist.id)}
                      onDoubleClick={() => onOpenDetail(artist)}
                      title={artist.name}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        tabIndex={-1}
                        className="size-3 shrink-0 rounded border-slate-300 accent-cyan-600"
                      />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800">
                        {artist.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {STATUS_META[artist.status].label}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
