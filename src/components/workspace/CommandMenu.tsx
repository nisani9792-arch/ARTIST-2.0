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
          a.tag.toLowerCase().includes(q) ||
          a.notes.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [artists, query]);

  const looksLikeAiCommand =
    query.trim().length > 8 &&
    /(סמן|העבר|צור|אשר|בטל|שנה|כל ה|אומנים|חתום|לא חתום|בעבודה)/.test(query);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/55 p-4 pt-[8vh] backdrop-blur-md"
      onClick={() => setCommandOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">מנוע פעולות</p>
          <p className="mt-0.5 text-sm font-extrabold text-slate-900">חיפוש, עדכון סטטוס ופקודות AI</p>
        </div>

        <Command label="חיפוש ופעולות" shouldFilter={false}>
          <div className="border-b border-slate-100 px-4 py-3">
            <Command.Input
              className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400/50"
              placeholder="חפש אומן או הקלד פקודה — 'סמן את X כחתום'"
              value={query}
              onValueChange={setCommandQuery}
              autoFocus
            />
          </div>

          {looksLikeAiCommand && onRunAi && (
            <div className="border-b border-slate-100 px-4 py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:shadow-lg"
                onClick={() => {
                  onRunAi(query.trim());
                  setCommandOpen(false);
                  setCommandQuery("");
                }}
              >
                <span>הרץ פקודת AI</span>
                <span className="truncate opacity-90">{query.trim().slice(0, 48)}…</span>
              </button>
            </div>
          )}

          <Command.List className="max-h-[min(58vh,440px)] overflow-y-auto p-3">
            <Command.Empty className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">לא נמצאו תוצאות</p>
              <p className="mt-1 text-xs text-slate-500">נסה שם אחר או פקודת AI בעברית</p>
            </Command.Empty>

            {filtered.map((artist) => (
              <Command.Item
                key={artist.id}
                value={artist.id}
                className="mb-2 cursor-pointer rounded-2xl border border-transparent px-3 py-3 transition aria-selected:border-cyan-200 aria-selected:bg-gradient-to-r aria-selected:from-cyan-50/80 aria-selected:to-white"
                onSelect={() => {
                  onOpenDetail(artist);
                  setCommandOpen(false);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{artist.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {STATUS_META[artist.status].label}
                      {artist.handlerName && ` · ${artist.handlerName}`}
                      {artist.isOdooApproved && " · Odoo ✓"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-700 shadow-sm hover:border-cyan-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(artist);
                      setCommandOpen(false);
                    }}
                  >
                    פרטים
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold transition",
                        artist.status === status
                          ? status === "signed"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : status === "in_process"
                              ? "bg-amber-500 text-white shadow-sm"
                              : "bg-slate-600 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700",
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
                      "rounded-full px-2.5 py-1 text-[10px] font-bold transition",
                      artist.isOdooApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300",
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

        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[10px] text-slate-500">
          <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-sm">Ctrl+K</kbd> לפתיחה ·{" "}
          <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-sm">Esc</kbd> לסגירה
        </div>
      </div>
    </div>
  );
}
