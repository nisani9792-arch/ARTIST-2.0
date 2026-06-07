"use client";

import { ArtistWorkspace } from "@/components/workspace/ArtistWorkspace";
import { useAccessGate } from "@/hooks/useAccessGate";
import { LockScreen } from "./LockScreen";
import { OperatorRegistration } from "./OperatorRegistration";

export function AccessGate() {
  const { phase, operatorName, error, unlock, register } = useAccessGate();

  if (phase === "loading") {
    return <div className="access-loading">טוען...</div>;
  }

  if (phase === "locked") {
    return <LockScreen onUnlock={unlock} />;
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
