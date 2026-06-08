"use client";

import { useEffect, useState } from "react";
import { formatHebrewDateTime, statusLabel } from "@/lib/format";
import type { Artist } from "@/lib/types";

type ArtistDetailPanelProps = {
  artist: Artist | null;
  onClose: () => void;
  onSave: (patch: Partial<Pick<Artist, "name" | "handlerName" | "isSigned" | "isOdooApproved">>) => Promise<void>;
};

export function ArtistDetailPanel({ artist, onClose, onSave }: ArtistDetailPanelProps) {
  const [name, setName] = useState("");
  const [handler, setHandler] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [isOdooApproved, setIsOdooApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!artist) return;
    setName(artist.name);
    setHandler(artist.handlerName);
    setIsSigned(artist.isSigned);
    setIsOdooApproved(artist.isOdooApproved);
  }, [artist]);

  if (!artist) return null;

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        handlerName: handler.trim(),
        isSigned,
        isOdooApproved,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="detail-overlay" role="presentation" onClick={onClose}>
      <aside
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`פרטי אומן — ${artist.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="detail-panel__header">
          <h2 className="detail-panel__title">{artist.name}</h2>
          <button type="button" className="detail-panel__close" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </header>

        <div className="detail-panel__body">
          <label className="detail-field">
            <span>שם אומן</span>
            <input
              className="m3-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="detail-field">
            <span>גורם מטפל</span>
            <input
              className="m3-input"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
            />
          </label>

          <label className="detail-field detail-field--row">
            <input
              type="checkbox"
              checked={isSigned}
              onChange={(e) => setIsSigned(e.target.checked)}
            />
            <span>חתום ({statusLabel(isSigned)})</span>
          </label>

          <label className="detail-field detail-field--row">
            <input
              type="checkbox"
              checked={isOdooApproved}
              onChange={(e) => setIsOdooApproved(e.target.checked)}
            />
            <span>מאושר באודו</span>
          </label>

          <p className="detail-panel__meta">
            עודכן לאחרונה: {formatHebrewDateTime(artist.lastActionTimestamp)}
          </p>
        </div>

        <footer className="detail-panel__footer">
          <button type="button" className="m3-btn" onClick={onClose}>
            ביטול
          </button>
          <button
            type="button"
            className="m3-btn m3-btn--filled"
            disabled={busy || !name.trim()}
            onClick={() => void handleSave()}
          >
            {busy ? "שומר..." : "שמור"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
