"use client";

import { useEffect, useRef, useState } from "react";

type WorkspaceActionsMenuProps = {
  onExport: () => void;
  onImportClick: () => void;
  onOpenTrash: () => void;
};

export function WorkspaceActionsMenu({
  onExport,
  onImportClick,
  onOpenTrash,
}: WorkspaceActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm hover:border-blue-300"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        עוד ⋯
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-1 min-w-[9rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-start text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              onExport();
              setOpen(false);
            }}
          >
            ייצוא CSV
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-start text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              onImportClick();
              setOpen(false);
            }}
          >
            ייבוא CSV
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-start text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              onOpenTrash();
              setOpen(false);
            }}
          >
            סל מחזור
          </button>
        </div>
      )}
    </div>
  );
}
