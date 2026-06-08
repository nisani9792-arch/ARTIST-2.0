"use client";

import { Command } from "cmdk";
import { useEffect, useMemo, useState } from "react";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

const ALL_STATUSES: ArtistStatus[] = ["unsigned", "in_process", "signed"];

type CommandMenuProps = {
  artists: Artist[];
  onStatusChange: (id: string, status: ArtistStatus) => void;
  onOpenDetail: (artist: Artist) => void;
};

export function CommandMenu({ artists, onStatusChange, onOpenDetail }: CommandMenuProps) {
  const open = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!open);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setCommandOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists.slice(0, 50);
    return artists
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.handlerName.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [artists, query]);

  if (!open) return null;

  return (
    <div className="elite-cmdk-overlay" onClick={() => setCommandOpen(false)} role="presentation">
      <div className="elite-cmdk" onClick={(e) => e.stopPropagation()}>
        <Command label="חיפוש אומנים" shouldFilter={false}>
          <Command.Input
            placeholder="חיפוש אומן או מטפל… (Ctrl+K)"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <Command.List>
            <Command.Empty>לא נמצאו תוצאות</Command.Empty>
            {filtered.map((artist) => (
              <Command.Item
                key={artist.id}
                value={artist.id}
                onSelect={() => {
                  onOpenDetail(artist);
                  setCommandOpen(false);
                }}
              >
                <div style={{ display: "flex", width: "100%", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {artist.name}
                  </span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {ALL_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        style={{
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          border:
                            artist.status === status
                              ? "none"
                              : "1px solid var(--jm3-color-outline-variant)",
                          background:
                            artist.status === status
                              ? "var(--jm3-color-primary)"
                              : "transparent",
                          color: artist.status === status ? "#fff" : "inherit",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (artist.status !== status) onStatusChange(artist.id, status);
                        }}
                      >
                        {STATUS_META[status].label}
                      </button>
                    ))}
                  </div>
                </div>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
