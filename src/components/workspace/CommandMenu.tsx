"use client";

import { Command } from "cmdk";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

const ALL_STATUSES: ArtistStatus[] = ["unsigned", "in_process", "signed"];

type CommandMenuProps = {
  artists: Artist[];
  onStatusChange: (id: string, status: ArtistStatus) => void;
  onOdooChange: (id: string, approved: boolean) => void;
  onOpenDetail: (artist: Artist) => void;
  onRunAi?: (command: string) => void;
};

export function CommandMenu({
  artists,
  onStatusChange,
  onOdooChange,
  onOpenDetail,
  onRunAi,
}: CommandMenuProps) {
  const open = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const query = useUiStore((s) => s.commandQuery);
  const setCommandQuery = useUiStore((s) => s.setCommandQuery);

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
          a.name.toLowerCase().includes(q) ||
          a.handlerName.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [artists, query]);

  const looksLikeAiCommand =
    query.trim().length > 8 &&
    /(סמן|העבר|צור|אשר|בטל|שנה|כל ה|אומנים|חתום|לא חתום|בעבודה)/.test(query);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => setCommandOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="חיפוש ופעולות" shouldFilter={false}>
          <Command.Input
            className="w-full border-b border-slate-100 px-4 py-3 text-sm font-medium outline-none"
            placeholder="חפש אומן — או הקלד פקודה: 'סמן את X כחתום' (Ctrl+K)"
            value={query}
            onValueChange={setCommandQuery}
            autoFocus
          />
          {looksLikeAiCommand && onRunAi && (
            <div className="border-b border-slate-100 px-3 py-2">
              <button
                type="button"
                className="w-full rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                onClick={() => {
                  onRunAi(query.trim());
                  setCommandOpen(false);
                  setCommandQuery("");
                }}
              >
                הרץ פקודת AI: {query.trim().slice(0, 60)}
                {query.length > 60 ? "…" : ""}
              </button>
            </div>
          )}
          <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-xs text-gray-500">
              לא נמצאו תוצאות — נסה שם אחר או פקודת AI
            </Command.Empty>
            {filtered.map((artist) => (
              <Command.Item
                key={artist.id}
                value={artist.id}
                className="flex cursor-pointer flex-col gap-2 rounded-xl px-3 py-2.5 aria-selected:bg-slate-50"
                onSelect={() => {
                  onOpenDetail(artist);
                  setCommandOpen(false);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{artist.name}</p>
                    <p className="truncate text-[10px] text-gray-500">
                      {STATUS_META[artist.status].label}
                      {artist.handlerName && ` · ${artist.handlerName}`}
                      {artist.isOdooApproved && " · Odoo ✓"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(artist);
                      setCommandOpen(false);
                    }}
                  >
                    עריכה
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                        artist.status === status
                          ? status === "signed"
                            ? "bg-emerald-600 text-white"
                            : status === "in_process"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:border-blue-300",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (artist.status !== status) onStatusChange(artist.id, status);
                      }}
                    >
                      {STATUS_META[status].label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                      artist.isOdooApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : "border border-slate-200 text-slate-600",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOdooChange(artist.id, !artist.isOdooApproved);
                    }}
                  >
                    {artist.isOdooApproved ? "בטל Odoo" : "אשר Odoo"}
                  </button>
                </div>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
