"use client";

type WorkspaceToolbarProps = {
  operatorName?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  quickName: string;
  onQuickNameChange: (value: string) => void;
  onQuickCreate: () => void;
  aiCommand: string;
  onAiCommandChange: (value: string) => void;
  onAiSubmit: () => void;
  isAiPending: boolean;
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenCommandMenu?: () => void;
};

export function WorkspaceToolbar({
  operatorName,
  search,
  onSearchChange,
  quickName,
  onQuickNameChange,
  onQuickCreate,
  aiCommand,
  onAiCommandChange,
  onAiSubmit,
  isAiPending,
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
            className="w-full min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-start text-sm font-medium text-slate-500 outline-none transition hover:bg-slate-200/80 focus:ring-2 focus:ring-blue-500 sm:min-w-[220px]"
            onClick={() => onOpenCommandMenu?.()}
            aria-label="חיפוש ופעולות"
          >
            {search.trim() || "חיפוש ופעולות… (Ctrl+K)"}
          </button>

          <input
            className="hidden w-36 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-cyan-500 md:block"
            placeholder="+ שם אומן — Enter"
            value={quickName}
            onChange={(e) => onQuickNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onQuickCreate();
              }
            }}
            aria-label="יצירה מהירה"
          />

          <textarea
            className="hidden min-h-[2.5rem] w-48 resize-y rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 lg:block"
            placeholder="פקודה / רשימת שמות (Ctrl+Enter)"
            value={aiCommand}
            onChange={(e) => onAiCommandChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                onAiSubmit();
              }
            }}
            rows={Math.min(8, Math.max(2, aiCommand.split("\n").length + 1))}
            disabled={isAiPending}
            aria-label="פקודת AI"
          />

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
