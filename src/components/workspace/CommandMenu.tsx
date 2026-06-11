"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  describeCommandPreview,
  extractEntriesFromText,
  parseLocalHebrewCommand,
} from "@/lib/ai-command-parser";
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
  const commandPreview = useMemo(() => describeCommandPreview(query), [query]);
  const parsedCommand = useMemo(() => parseLocalHebrewCommand(query), [query]);

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
    (parsedCommand !== null ||
      query.includes("\n") ||
      parsedEntries.length >= 2 ||
      /(סמן|העבר|תעביר|צור|הוסף|להוסיף|אשר|בטל|שנה|שים|הכנס|כל ה|אומנים|חתום|לא חתום|בעבודה|רשימה|הבאים)/i.test(
        query,
      ));

  const runCommand = () => {
    if (!onRunAi || !query.trim()) return;
    onRunAi(query.trim());
    setCommandOpen(false);
    setCommandQuery("");
  };

  if (!open) return null;

  const rowCount = Math.min(12, Math.max(3, query.split("\n").length + 1));
  const entryCount =
    parsedCommand?.action === "upsert_by_names"
      ? parsedCommand.entries.length
      : parsedEntries.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/55 p-3 pt-[6vh] backdrop-blur-md lg:p-4 lg:pt-[8vh]"
      onClick={() => setCommandOpen(false)}
      role="presentation"
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="חיפוש ופעולות"
      >
        <div className="shrink-0 border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-4 py-3 lg:px-5 lg:py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">מנוע פעולות</p>
          <p className="mt-0.5 text-sm font-extrabold text-slate-900">חיפוש, רשימות ופקודות</p>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-3 py-2 lg:px-4 lg:py-3">
          <textarea
            className="w-full resize-y rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-medium leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400/50 lg:px-4 lg:py-3"
            placeholder={`שורה אחת = חיפוש\n\nרשימה:\nסמן כחתום\n1. משה לוק\n2. דני כהן`}
            value={query}
            onChange={(e) => setCommandQuery(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && looksLikeAiCommand) {
                e.preventDefault();
                runCommand();
              }
            }}
            rows={rowCount}
            autoFocus
          />
          <p className="mt-1.5 text-[10px] text-slate-500">
            Enter = שורה חדשה · Ctrl+Enter או כפתור למטה = הרצה
          </p>
        </div>

        {looksLikeAiCommand && onRunAi && (
          <div className="shrink-0 border-b border-slate-100 px-3 py-2 lg:px-4 lg:py-3">
            {commandPreview && (
              <p className="mb-2 text-[11px] font-semibold text-cyan-800">
                תצוגה מקדימה: {commandPreview}
                {entryCount > 0 && ` (${entryCount} שמות)`}
              </p>
            )}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
              onClick={runCommand}
            >
              הרץ פקודה
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-2 lg:p-3">
          {!looksLikeAiCommand && filtered.length === 0 && query.trim() && !query.includes("\n") && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">לא נמצאו תוצאות</p>
              <p className="mt-1 text-xs text-slate-500">הדבק רשימת שמות לפעולה מרובה</p>
            </div>
          )}

          {!looksLikeAiCommand &&
            filtered.map((artist) => (
              <button
                key={artist.id}
                type="button"
                className="mb-1.5 w-full cursor-pointer rounded-xl border border-transparent px-2 py-2 text-start transition hover:border-cyan-200 hover:bg-cyan-50/50 lg:mb-2 lg:rounded-2xl lg:px-3 lg:py-3"
                onClick={() => {
                  onOpenDetail(artist);
                  setCommandOpen(false);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{artist.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {STATUS_META[artist.status].label}
                      {artist.handlerName && ` · ${artist.handlerName}`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    פרטים
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                        artist.status === status
                          ? "bg-slate-700 text-white"
                          : "border border-slate-200 bg-white text-slate-600",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (artist.status !== status) onStatusChange(artist.id, status);
                      }}
                    >
                      {STATUS_META[status].label}
                    </button>
                  ))}
                </div>
              </button>
            ))}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[10px] text-slate-500 lg:px-4 lg:py-2">
          <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-sm">Ctrl+K</kbd> ·{" "}
          <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-sm">Esc</kbd>
        </div>
      </div>
    </div>
  );
}
