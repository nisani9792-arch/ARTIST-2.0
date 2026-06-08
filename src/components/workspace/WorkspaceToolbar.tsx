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
}: WorkspaceToolbarProps) {
  return (
    <header className="workspace-topbar">
      <div className="workspace-topbar__brand">
        <img
          src="/logo.png"
          alt="ARTIST 2.0"
          className="workspace-topbar__logo-img"
          width={44}
          height={44}
        />
        <div className="workspace-topbar__titles">
          <span className="workspace-topbar__logo">ARTIST 2.0</span>
          <span className="workspace-topbar__subtitle">
            {operatorName ? `מפעיל: ${operatorName}` : "לוח קנבן"}
            {totalCount > 0 && ` · ${totalCount.toLocaleString("he-IL")} אומנים`}
            {selectedCount > 0 && ` · ${selectedCount} נבחרו`}
          </span>
        </div>
      </div>

      <div className="workspace-topbar__controls">
        <input
          className="m3-input workspace-topbar__search"
          placeholder="חיפוש לפי שם או מטפל..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="חיפוש"
        />

        <input
          className="m3-input workspace-topbar__quick"
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

        <input
          className="m3-input workspace-topbar__ai"
          placeholder="פקודת AI בעברית..."
          value={aiCommand}
          onChange={(e) => onAiCommandChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAiSubmit();
            }
          }}
          disabled={isAiPending}
          aria-label="פקודת AI"
        />

        <button type="button" className="m3-btn" onClick={onSelectAll} title="בחר את כל האומנים המוצגים">
          בחר הכל
        </button>

        {selectedCount > 0 && (
          <button type="button" className="m3-btn" onClick={onClearSelection}>
            נקה בחירה
          </button>
        )}
      </div>
    </header>
  );
}
