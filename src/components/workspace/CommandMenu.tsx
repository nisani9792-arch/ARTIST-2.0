"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import { extractEntriesFromText } from "@/lib/ai-command-parser";
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

  const parsedEntries = useMemo(() => extractEntriesFromText(query), [query]);

  const filtered = useMemo(() => {
    const firstLine = query.split("\n")[0]?.trim().toLowerCase() ?? "";
    if (!firstLine || query.includes("\n")) return [];
    return artists
      .filter(
        (a) =>
          a.name.toLowerCase().includes(firstLine) ||
          a.handlerName.toLowerCase().includes(firstLine) ||
          a.tag.toLowerCase().includes(firstLine),
      )
      .slice(0, 40);
  }, [artists, query]);

  const looksLikeAiCommand =
    query.trim().length > 4 &&
    (query.includes("\n") ||
      parsedEntries.length >= 2 ||
      /(סמן|העבר|צור|אשר|בטל|שנה|כל ה|אומנים|חתום|לא חתום|בעבודה|רשימה|הבאים)/.test(query));

  if (!open) return null;

  const rowCount = Math.min(14, Math.max(3, query.split("\n").length + 1));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/55 p-4 pt-[8vh] backdrop-blur-md"
      onClick={() => setCommandOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="חיפוש ופעולות"
      >
        <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">מנוע פעולות</p>
          <p className="mt-0.5 text-sm font-extrabold text-slate-900">חיפוש, רשימות שמות ופקודות</p>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <textarea
            className="w-full resize-y rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400/50"
            placeholder={`שורה אחת = חיפוש אומן\n\nאו הדבק רשימה:\n1. משה לוק\n2. מוטי וייס - לקראת סיום\n\nאופציונלי בשורה ראשונה: סמן כחתום`}
            value={query}
            onChange={(e) => setCommandQuery(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && looksLikeAiCommand && onRunAi) {
                e.preventDefault();
                onRunAi(query.trim());
                setCommandOpen(false);
                setCommandQuery("");
              }
            }}
            rows={rowCount}
            autoFocus
          />
          <p className="mt-2 text-[10px] text-slate-500">
            Enter = שורה חדשה · Ctrl+Enter = הרץ פקודה · אומנים חדשים ייווצרו אוטומטית
          </p>
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
              <span>
                הרץ רשימה ({parsedEntries.length || "?"} שמות) — Ctrl+Enter
              </span>
            </button>
          </div>
        )}

        <div className="max-h-[min(50vh,380px)] overflow-y-auto p-3">
          {!looksLikeAiCommand && filtered.length === 0 && query.trim() && !query.includes("\n") && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">לא נמצאו תוצאות</p>
              <p className="mt-1 text-xs text-slate-500">הדבק רשימת שמות (שורה לכל אומן) לפעולה מרובה</p>
            </div>
          )}

          {!looksLikeAiCommand &&
            filtered.map((artist) => (
              <button
                key={artist.id}
                type="button"
                className="mb-2 w-full cursor-pointer rounded-2xl border border-transparent px-3 py-3 text-start transition hover:border-cyan-200 hover:bg-cyan-50/50"
                onClick={() => {
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
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-700">
                    פרטים
                  </span>
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
              </button>
            ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[10px] text-slate-500">
          <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-sm">Ctrl+K</kbd> לפתיחה ·{" "}
          <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-sm">Esc</kbd> לסגירה
        </div>
      </div>
    </div>
  );
}
