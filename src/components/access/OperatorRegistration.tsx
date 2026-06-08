"use client";

import { useState } from "react";

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
    <div
      className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-50 via-zinc-50 to-cyan-50/30 p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="רישום מפעיל"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.png"
            alt="ARTIST 2.0"
            width={64}
            height={64}
            className="rounded-2xl shadow-sm"
          />
        </div>

        <div
          className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-100 text-xl"
          aria-hidden
        >
          👤
        </div>

        <h1 className="text-center text-lg font-extrabold text-slate-900">הזן שם משתמש — גורם מטפל</h1>
        <p className="mt-2 text-center text-xs text-gray-500">
          נשמר לפי כתובת הרשת שלך. כל שינוי במערכת יירשם על שמך.
        </p>

        <form className="mt-6 flex flex-col gap-3" onSubmit={(e) => void handleSubmit(e)}>
          <input
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
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
            <p className="text-center text-xs font-bold text-red-600">{localError || error}</p>
          )}
          <button
            type="submit"
            className="rounded-full bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "שומר..." : "המשך למערכת"}
          </button>
        </form>
      </div>
    </div>
  );
}
