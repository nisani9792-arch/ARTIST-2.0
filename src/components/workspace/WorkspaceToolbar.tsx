"use client";

type WorkspaceToolbarProps = {
  operatorName?: string | null;
  search: string;
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenCommandMenu?: () => void;
};

export function WorkspaceToolbar({
  operatorName,
  search,
  totalCount,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onOpenCommandMenu,
}: WorkspaceToolbarProps) {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200 bg-white/80 pt-safe backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/logo.png"
            alt="ARTIST 2.0"
            className="size-10 shrink-0 rounded-xl object-cover shadow-sm"
            width={40}
            height={40}
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-slate-900">ARTIST 2.0</h1>
            <p className="truncate text-xs text-gray-500">
              {operatorName ? `מפעיל: ${operatorName}` : "לוח קנבן"}
              {totalCount > 0 && ` · ${totalCount.toLocaleString("he-IL")} אומנים`}
              {selectedCount > 0 && ` · ${selectedCount} נבחרו`}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="w-full min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-start text-sm font-medium text-slate-500 outline-none transition hover:bg-slate-200/80 focus:ring-2 focus:ring-blue-500 sm:min-w-[260px]"
            onClick={() => onOpenCommandMenu?.()}
            aria-label="חיפוש ופקודות"
          >
            {search.trim() || "חיפוש, פקודות ורשימות… (Ctrl+K)"}
          </button>

          <button
            type="button"
            className="rounded-full bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-700"
            onClick={onSelectAll}
            title="בחר את כל האומנים המוצגים"
          >
            בחר הכל
          </button>

          {selectedCount > 0 && (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              onClick={onClearSelection}
            >
              נקה בחירה
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
