"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import type { Artist } from "@/lib/types";
import { useUiStore } from "@/stores";
import { VaultArtistRow } from "./VaultArtistRow";

const VAULT_ROW_HEIGHT = 40;

type UnsignedVaultProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (artist: Artist) => void;
  embedded?: boolean;
  draggable?: boolean;
};

export function UnsignedVault({
  artists,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
  embedded = false,
  draggable = false,
}: UnsignedVaultProps) {
  const vaultOpen = useUiStore((s) => s.vaultOpen);
  const vaultSearch = useUiStore((s) => s.vaultSearch);
  const setVaultSearch = useUiStore((s) => s.setVaultSearch);
  const toggleVault = useUiStore((s) => s.toggleVault);
  const showPanel = embedded || vaultOpen;
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = vaultSearch.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.handlerName.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q),
    );
  }, [artists, vaultSearch]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
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
              {filtered.length.toLocaleString("he-IL")}
              {vaultSearch && ` / ${artists.length}`}
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

        <input
          type="search"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-400/50"
          placeholder="חיפוש ב-Vault…"
          value={vaultSearch}
          onChange={(e) => setVaultSearch(e.target.value)}
        />

        {draggable && (
          <p className="text-[10px] leading-snug text-slate-500">
            גרור ⠿ לעמודת חתומים / בעבודה
          </p>
        )}

        <div ref={scrollRef} className="kanban-scroll min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-[10px] text-gray-500">
              {vaultSearch ? "אין תוצאות בחיפוש" : "אין אומנים ברשימה"}
            </p>
          ) : (
            <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
              {virtualizer.getVirtualItems().map((row) => {
                const artist = filtered[row.index];
                return (
                  <div
                    key={artist.id}
                    className="absolute start-0 end-0"
                    style={{
                      height: `${row.size}px`,
                      transform: `translateY(${row.start}px)`,
                    }}
                  >
                    <VaultArtistRow
                      artist={artist}
                      selected={selectedIds.has(artist.id)}
                      draggable={draggable}
                      onSelect={() => onToggleSelect(artist.id)}
                      onOpenDetail={() => onOpenDetail(artist)}
                    />
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
