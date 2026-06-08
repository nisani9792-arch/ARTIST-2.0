"use client";

import { ArtistWorkspace } from "@/components/workspace/ArtistWorkspace";
import { useAccessGate } from "@/hooks/useAccessGate";
import { LockScreen } from "./LockScreen";
import { OperatorRegistration } from "./OperatorRegistration";

export function AccessGate() {
  const { phase, operatorName, error, afterUnlock, register } = useAccessGate();

  if (phase === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div
            className="size-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
            aria-hidden
          />
          <p className="text-sm font-medium text-gray-500">טוען...</p>
        </div>
      </div>
    );
  }

  if (phase === "locked") {
    return (
      <LockScreen
        onUnlock={() => void afterUnlock()}
        knownOperatorName={operatorName}
      />
    );
  }

  if (phase === "register") {
    return (
      <OperatorRegistration
        onRegister={register}
        error={error}
        defaultName={operatorName ?? undefined}
      />
    );
  }

  return <ArtistWorkspace operatorName={operatorName} offline={phase === "offline"} />;
}
