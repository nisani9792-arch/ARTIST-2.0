"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { Artist } from "@/lib/types";
import { useUiStore } from "@/stores";
import { ARTIST_CARD_HEIGHT, ArtistCard } from "./kanban/ArtistCard";

type UnsignedVaultProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (artist: Artist) => void;
};

export function UnsignedVault({
  artists,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
}: UnsignedVaultProps) {
  const vaultOpen = useUiStore((s) => s.vaultOpen);
  const toggleVault = useUiStore((s) => s.toggleVault);
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ARTIST_CARD_HEIGHT + 8,
    overscan: 10,
  });

  if (!vaultOpen) {
    return (
      <aside
        className="flex w-12 shrink-0 cursor-pointer flex-col items-center rounded-3xl border border-slate-200 bg-slate-50 py-4 transition hover:border-cyan-300 hover:bg-cyan-50/50"
        onClick={toggleVault}
        title="Unsigned Vault"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggleVault()}
      >
        <span
          className="text-xs font-bold text-slate-500 [writing-mode:vertical-rl]"
          style={{ textOrientation: "mixed" }}
        >
          Vault ({artists.length})
        </span>
      </aside>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-slate-400" aria-hidden />
          <h2 className="text-sm font-extrabold text-slate-700">לא חתומים — Vault</h2>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-500 shadow-sm">
            {artists.length.toLocaleString("he-IL")}
          </span>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
          onClick={toggleVault}
        >
          סגור
        </button>
      </header>

      <div ref={scrollRef} className="kanban-scroll min-h-0 flex-1 overflow-y-auto">
        {artists.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-500">אין אומנים ב-Vault</p>
        ) : (
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((row) => {
              const artist = artists[row.index];
              return (
                <div
                  key={artist.id}
                  className="absolute start-0 end-0 pb-2"
                  style={{
                    height: `${row.size}px`,
                    transform: `translateY(${row.start}px)`,
                  }}
                >
                  <ArtistCard
                    artist={artist}
                    selected={selectedIds.has(artist.id)}
                    onSelect={() => {
                      onToggleSelect(artist.id);
                    }}
                    onOpenDetail={() => onOpenDetail(artist)}
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
