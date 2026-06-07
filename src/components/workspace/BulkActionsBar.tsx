"use client";

import { useState } from "react";

type BulkActionsBarProps = {
  count: number;
  onApplyHandler: (handler: string) => void;
  onClear: () => void;
};

export function BulkActionsBar({ count, onApplyHandler, onClear }: BulkActionsBarProps) {
  const [handler, setHandler] = useState("");

  if (count === 0) return null;

  return (
    <div className="bulk-bar" role="toolbar" aria-label="פעולות מרובות">
      <span className="bulk-bar__count">{count} נבחרו</span>
      <input
        className="bulk-bar__input"
        placeholder="גורם מטפל חדש"
        value={handler}
        onChange={(e) => setHandler(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && handler.trim()) {
            onApplyHandler(handler.trim());
            setHandler("");
          }
        }}
      />
      <button
        type="button"
        className="bulk-bar__btn bulk-bar__btn--primary"
        disabled={!handler.trim()}
        onClick={() => {
          onApplyHandler(handler.trim());
          setHandler("");
        }}
      >
        החל מטפל
      </button>
      <button type="button" className="bulk-bar__btn" onClick={onClear}>
        ביטול
      </button>
    </div>
  );
}
