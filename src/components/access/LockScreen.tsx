"use client";

import { useState } from "react";
import { tryJusicCode } from "@/lib/access/constants";
import { useBiometricUnlock } from "@/hooks/useBiometricUnlock";

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
    <div
      className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-50 via-zinc-50 to-blue-50/30 p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="מסך כניסה"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.png"
            alt="ARTIST 2.0"
            width={72}
            height={72}
            className="rounded-2xl shadow-sm"
          />
        </div>

        <div
          className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-100 text-xl"
          aria-hidden
        >
          🔒
        </div>

        <h1 className="text-center text-lg font-extrabold text-slate-900">אנא הכנס סיסמא</h1>
        {knownOperatorName && (
          <p className="mt-2 text-center text-xs text-gray-500">
            שלום {knownOperatorName} — הזן סיסמה או טביעת אצבע לכניסה
          </p>
        )}

        <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
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
            <p className="text-center text-xs font-bold text-red-600" role="alert">
              קוד שגוי
            </p>
          )}
        </form>

        {biometricAvailable && (
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-50"
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
