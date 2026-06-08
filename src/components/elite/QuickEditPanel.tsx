"use client";

import { useEffect, useState } from "react";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

type QuickEditPanelProps = {
  artist: Artist | null;
  handlers: string[];
  onSave: (id: string, patch: Partial<Pick<Artist, "handlerName" | "status" | "isOdooApproved">>) => void;
};

export function QuickEditPanel({ artist, handlers, onSave }: QuickEditPanelProps) {
  const quickEditId = useUiStore((s) => s.quickEditArtistId);
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId);

  const [handler, setHandler] = useState("");
  const [status, setStatus] = useState<ArtistStatus>("unsigned");
  const [isOdooApproved, setIsOdooApproved] = useState(false);

  useEffect(() => {
    if (!artist) return;
    setHandler(artist.handlerName);
    setStatus(artist.status);
    setIsOdooApproved(artist.isOdooApproved);
  }, [artist]);

  if (!artist || quickEditId !== artist.id) return null;

  return (
    <aside className="elite-quick-edit">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{artist.name}</h3>
        <button type="button" className="bulk-bar__btn" onClick={() => setQuickEditArtistId(null)}>
          ✕
        </button>
      </div>

      <label style={{ fontSize: 11, fontWeight: 600 }}>מטפל</label>
      <select className="elite-field" value={handler} onChange={(e) => setHandler(e.target.value)}>
        {handlers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <label style={{ fontSize: 11, fontWeight: 600 }}>סטטוס</label>
      <select
        className="elite-field"
        value={status}
        onChange={(e) => setStatus(e.target.value as ArtistStatus)}
      >
        {(Object.keys(STATUS_META) as ArtistStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </select>

      <label style={{ display: "flex", gap: 8, fontSize: 12 }}>
        <input
          type="checkbox"
          checked={isOdooApproved}
          onChange={(e) => setIsOdooApproved(e.target.checked)}
        />
        מאושר באודו
      </label>

      <button
        type="button"
        className="bulk-bar__btn bulk-bar__btn--primary"
        onClick={() => onSave(artist.id, { handlerName: handler, status, isOdooApproved })}
      >
        שמור
      </button>
    </aside>
  );
}
