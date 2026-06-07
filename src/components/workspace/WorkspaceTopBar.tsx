"use client";

type WorkspaceTopBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  quickName: string;
  onQuickNameChange: (value: string) => void;
  onQuickCreate: () => void;
  aiCommand: string;
  onAiCommandChange: (value: string) => void;
  onAiSubmit: () => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  isAiPending: boolean;
};

export function WorkspaceTopBar({
  search,
  onSearchChange,
  quickName,
  onQuickNameChange,
  onQuickCreate,
  aiCommand,
  onAiCommandChange,
  onAiSubmit,
  selectionMode,
  onToggleSelectionMode,
  isAiPending,
}: WorkspaceTopBarProps) {
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
          <span className="workspace-topbar__subtitle">שולחן עבודה</span>
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

        <button
          type="button"
          className={selectionMode ? "m3-btn m3-btn--filled" : "m3-btn"}
          onClick={onToggleSelectionMode}
        >
          {selectionMode ? "סיום בחירה" : "בחירה"}
        </button>
      </div>
    </header>
  );
}
