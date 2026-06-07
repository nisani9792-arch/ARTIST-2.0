"use client";

import { useRef, useState } from "react";
import { tryJusicCode } from "@/lib/access/constants";
import type { UnlockMethod } from "@/api/access";
import { useBiometricUnlock } from "@/hooks/useBiometricUnlock";
import "./access.css";

type LockScreenProps = {
  onUnlock: (options?: { method?: UnlockMethod; secret?: string }) => Promise<void>;
};

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unlockStarted = useRef(false);

  const tryUnlock = async (options: { method: UnlockMethod; secret?: string }) => {
    if (unlockStarted.current) return;
    unlockStarted.current = true;
    setBusy(true);
    setError("");
    try {
      await onUnlock(options);
    } catch (err) {
      setError(err instanceof Error ? err.message : "פתיחה נכשלה");
      unlockStarted.current = false;
    } finally {
      setBusy(false);
    }
  };

  const { available: biometricAvailable, busy: biometricBusy, unlock: unlockWithBiometric } =
    useBiometricUnlock(() => tryUnlock({ method: "biometric" }));

  const handleChange = (value: string) => {
    setPassword(value);
    if (tryJusicCode(value)) {
      void tryUnlock({ method: "password", secret: value });
    }
  };

  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-label="מסך כניסה">
      <div className="lock-card">
        <div className="lock-logo-wrap">
          <img src="/logo.png" alt="ARTIST 2.0" width={72} height={72} />
        </div>

        <div className="lock-icon-wrap" aria-hidden>
          🔒
        </div>

        <p className="lock-prompt">אנא הכנס סיסמה</p>
        <p className="lock-hint">קוד גישה: JUSIC · או Space × 3</p>

        <form
          className="lock-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (tryJusicCode(password)) {
              void tryUnlock({ method: "password", secret: password });
            }
          }}
        >
          <input
            className="lock-input"
            type="password"
            inputMode="text"
            autoComplete="off"
            maxLength={20}
            value={password}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="••••••••"
            aria-label="סיסמה"
            disabled={busy}
            autoFocus
          />
        </form>

        {error && <p className="lock-error">{error}</p>}

        {biometricAvailable && (
          <button
            type="button"
            className="lock-biometric"
            onClick={() => void unlockWithBiometric()}
            disabled={biometricBusy || busy}
          >
            <span aria-hidden>👆</span>
            <span>
              {biometricBusy || busy
                ? "מאמת..."
                : "כניסה ביומטרית (טביעת אצבע / Windows Hello)"}
            </span>
          </button>
        )}

        <p className="lock-space-hint">רמז: לחץ רווח 3 פעמים במהירות לפתיחה</p>
      </div>
    </div>
  );
}
