"use client";

import { useEffect, useState } from "react";
import { formatHebrewDateTime, statusLabel } from "@/lib/format";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";

type ArtistDetailPanelProps = {
  artist: Artist | null;
  onClose: () => void;
  onSave: (
    patch: Partial<Pick<Artist, "name" | "handlerName" | "status" | "isOdooApproved">>,
  ) => Promise<void>;
};

export function ArtistDetailPanel({ artist, onClose, onSave }: ArtistDetailPanelProps) {
  const [name, setName] = useState("");
  const [handler, setHandler] = useState("");
  const [status, setStatus] = useState<ArtistStatus>("unsigned");
  const [isOdooApproved, setIsOdooApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!artist) return;
    setName(artist.name);
    setHandler(artist.handlerName);
    setStatus(artist.status);
    setIsOdooApproved(artist.isOdooApproved);
  }, [artist]);

  if (!artist) return null;

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        handlerName: handler.trim(),
        status,
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
            <input className="m3-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="detail-field">
            <span>גורם מטפל</span>
            <input className="m3-input" value={handler} onChange={(e) => setHandler(e.target.value)} />
          </label>

          <label className="detail-field">
            <span>סטטוס</span>
            <select
              className="m3-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as ArtistStatus)}
            >
              {(Object.keys(STATUS_META) as ArtistStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </label>

          <label className="detail-field detail-field--row">
            <input
              type="checkbox"
              checked={isOdooApproved}
              onChange={(e) => setIsOdooApproved(e.target.checked)}
            />
            <span>מאושר באודו</span>
          </label>

          <p className="detail-meta">
            סטטוס נוכחי: {statusLabel(status)} · עודכן {formatHebrewDateTime(artist.lastActionTimestamp)}
          </p>
        </div>

        <footer className="detail-panel__footer">
          <button type="button" className="m3-btn m3-btn--primary" disabled={busy} onClick={() => void handleSave()}>
            {busy ? "שומר…" : "שמור"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
