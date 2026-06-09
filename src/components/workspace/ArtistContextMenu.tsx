"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Artist, ArtistStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

type ArtistContextMenuProps = {
  artist: Artist | null;
  position: { x: number; y: number } | null;
  operatorName?: string | null;
  onClose: () => void;
  onOpenDetail: (artist: Artist) => void;
  onToggleOdoo: (artist: Artist) => void;
  onAssignMe: (artist: Artist) => void;
  onStatusChange: (artist: Artist, status: ArtistStatus) => void;
  onMoveToTrash: (artist: Artist) => void;
};

export function ArtistContextMenu({
  artist,
  position,
  operatorName,
  onClose,
  onOpenDetail,
  onToggleOdoo,
  onAssignMe,
  onStatusChange,
  onMoveToTrash,
}: ArtistContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!artist || !position) return;
    const close = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [artist, position, onClose]);

  if (!artist || !position) return null;

  const menuWidth = 200;
  let left = position.x;
  let top = position.y;
  if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
  if (top + 220 > window.innerHeight - 8) top = window.innerHeight - 220 - 8;
  left = Math.max(8, left);
  top = Math.max(8, top);

  const statuses = Object.keys(STATUS_META) as ArtistStatus[];

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", left, top, width: menuWidth, zIndex: 200 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
      role="menu"
    >
      <button
        type="button"
        className="w-full px-3 py-2 text-start text-xs font-medium hover:bg-slate-50"
        onClick={() => {
          onOpenDetail(artist);
          onClose();
        }}
      >
        עריכה מלאה
      </button>
      <button
        type="button"
        className="w-full px-3 py-2 text-start text-xs font-medium hover:bg-slate-50"
        onClick={() => {
          onToggleOdoo(artist);
          onClose();
        }}
      >
        {artist.isOdooApproved ? "בטל אישור Odoo" : "אשר Odoo"}
      </button>
      {operatorName && (
        <button
          type="button"
          className="w-full px-3 py-2 text-start text-xs font-medium hover:bg-slate-50"
          onClick={() => {
            onAssignMe(artist);
            onClose();
          }}
        >
          שייך אליי ({operatorName})
        </button>
      )}
      <div className="border-t border-slate-100 px-2 py-1">
        <p className="px-1 py-1 text-[10px] font-bold text-gray-400">סטטוס</p>
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            className="w-full rounded-lg px-2 py-1 text-start text-[10px] font-bold hover:bg-slate-50"
            onClick={() => {
              onStatusChange(artist, s);
              onClose();
            }}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="w-full border-t border-slate-100 px-3 py-2 text-start text-xs font-bold text-red-600 hover:bg-red-50"
        onClick={() => {
          onMoveToTrash(artist);
          onClose();
        }}
      >
        העבר לסל מחזור
      </button>
    </div>,
    document.body,
  );
}
