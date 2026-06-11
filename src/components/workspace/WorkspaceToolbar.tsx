"use client";

type WorkspaceToolbarProps = {
  operatorName?: string | null;
  search: string;
  totalCount: number;
  selectedCount: number;
  onClearSelection: () => void;
  onOpenCommandMenu?: () => void;
};

export function WorkspaceToolbar({
  operatorName,
  search,
  totalCount,
  selectedCount,
  onClearSelection,
  onOpenCommandMenu,
}: WorkspaceToolbarProps) {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200 bg-white/90 pt-safe backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-2 lg:gap-3 lg:px-4 lg:py-3">
        <img
          src="/logo.png"
          alt="ARTIST 2.0"
          className="size-8 shrink-0 rounded-lg object-cover shadow-sm lg:size-10 lg:rounded-xl"
          width={40}
          height={40}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-extrabold text-slate-900 lg:text-base">ARTIST 2.0</h1>
          <p className="truncate text-[10px] text-gray-500 lg:text-xs">
            {operatorName ? operatorName : "לוח קנבן"}
            {totalCount > 0 && ` · ${totalCount.toLocaleString("he-IL")}`}
            {selectedCount > 0 && ` · ${selectedCount} נבחרו`}
          </p>
        </div>

        {/* Desktop only — mobile uses bottom nav "חיפוש" */}
        <button
          type="button"
          className="hidden min-w-[220px] flex-1 rounded-full bg-slate-100 px-4 py-2 text-start text-sm font-medium text-slate-500 outline-none transition hover:bg-slate-200/80 focus:ring-2 focus:ring-blue-500 lg:block"
          onClick={() => onOpenCommandMenu?.()}
          aria-label="חיפוש ופקודות"
        >
          {search.trim() || "חיפוש, פקודות ורשימות… (Ctrl+K)"}
        </button>

        {selectedCount > 0 && (
          <button
            type="button"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 lg:px-3 lg:py-2 lg:text-xs"
            onClick={onClearSelection}
          >
            נקה
          </button>
        )}
      </div>
    </header>
  );
}
