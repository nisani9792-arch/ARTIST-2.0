"use client";

import { useState } from "react";
import { tryJusicCode } from "@/lib/access/constants";
import { useBiometricUnlock } from "@/hooks/useBiometricUnlock";
import "./access.css";

type LockScreenProps = {
  onUnlock: () => void;
  knownOperatorName?: string | null;
};

export function LockScreen({ onUnlock, knownOperatorName }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [wrongCode, setWrongCode] = useState(false);

  const { available: biometricAvailable, busy: biometricBusy, unlock: unlockWithBiometric } =
    useBiometricUnlock(onUnlock);

  const tryCode = (value: string) => {
    if (tryJusicCode(value)) {
      setWrongCode(false);
      onUnlock();
      return true;
    }
    return false;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tryCode(password) && password.trim().length > 0) {
      setWrongCode(true);
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

        <p className="lock-prompt">אנא הכנס סיסמא</p>
        {knownOperatorName && (
          <p className="lock-known-operator">
            שלום {knownOperatorName} — הזן סיסמה או טביעת אצבע לכניסה
          </p>
        )}

        <form className="lock-form" onSubmit={handleSubmit}>
          <input
            className="lock-input"
            type="password"
            inputMode="text"
            autoComplete="off"
            maxLength={20}
            value={password}
            onChange={(event) => {
              const next = event.target.value;
              setPassword(next);
              setWrongCode(false);
              tryCode(next);
            }}
            placeholder="••••••••••••••••••••"
            aria-label="סיסמא"
            aria-invalid={wrongCode}
            autoFocus
          />
          {wrongCode && (
            <p className="lock-error" role="alert">
              קוד שגוי
            </p>
          )}
        </form>

        {biometricAvailable && (
          <button
            type="button"
            className="lock-biometric"
            onClick={() => void unlockWithBiometric()}
            disabled={biometricBusy}
          >
            <span aria-hidden>👆</span>
            <span>
              {biometricBusy
                ? "מאמת..."
                : "כניסה ביומטרית (טביעת אצבע / Windows Hello)"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
