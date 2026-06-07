"use client";

import { useState } from "react";
import "./access.css";

type OperatorRegistrationProps = {
  onRegister: (displayName: string) => Promise<string | null>;
  error?: string;
  defaultName?: string;
};

export function OperatorRegistration({
  onRegister,
  error,
  defaultName,
}: OperatorRegistrationProps) {
  const [name, setName] = useState(defaultName?.trim() ?? "");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setLocalError("יש להזין שם של לפחות 2 תווים");
      return;
    }

    setBusy(true);
    setLocalError("");
    try {
      await onRegister(trimmed);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "הרישום נכשל");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-label="רישום מפעיל">
      <div className="lock-card">
        <div className="lock-logo-wrap">
          <img src="/logo.png" alt="ARTIST 2.0" width={64} height={64} />
        </div>

        <div className="lock-icon-wrap" aria-hidden>
          👤
        </div>

        <p className="lock-prompt">הזן שם משתמש — גורם מטפל</p>
        <p className="lock-known-operator">
          נשמר לפי כתובת הרשת שלך. כל שינוי במערכת יירשם על שמך.
        </p>

        <form className="lock-form" onSubmit={(e) => void handleSubmit(e)}>
          <input
            className="lock-input"
            type="text"
            inputMode="text"
            autoComplete="name"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם גורם מטפל"
            aria-label="שם גורם מטפל"
            autoFocus
          />
          {(localError || error) && (
            <p className="lock-error">{localError || error}</p>
          )}
          <button
            type="submit"
            className="lock-biometric lock-biometric--primary"
            disabled={busy}
            style={{ marginTop: 12 }}
          >
            {busy ? "שומר..." : "המשך למערכת"}
          </button>
        </form>
      </div>
    </div>
  );
}
