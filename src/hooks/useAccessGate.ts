"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAccessStatus,
  registerOperator,
  unlockGate,
  type AccessState,
  type UnlockMethod,
} from "@/api/access";
import {
  getStoredOperatorName,
  isTrustedDevice,
  markTrustedDevice,
  setStoredOperatorName,
} from "@/lib/operator";

const RESET_MS = 1600;
const REQUIRED_PRESSES = 3;

export type AccessPhase = "loading" | "locked" | "register" | "ready" | "offline";

export function useAccessGate() {
  const [phase, setPhase] = useState<AccessPhase>("loading");
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [error, setError] = useState("");

  const applyReady = useCallback((name: string) => {
    setStoredOperatorName(name);
    markTrustedDevice();
    setOperatorName(name);
    setPhase("ready");
  }, []);

  const resolveAfterUnlock = useCallback(
    async (access: AccessState) => {
      if (!access.gateUnlocked) {
        setOperatorName(null);
        setPhase("locked");
        return;
      }

      if (access.displayName) {
        applyReady(access.displayName);
        return;
      }

      const local = getStoredOperatorName();
      if (local) {
        try {
          const registered = await registerOperator(local);
          if (registered.displayName) {
            applyReady(registered.displayName);
            return;
          }
        } catch {
          // fall through
        }
      }

      setOperatorName(local);
      setPhase("register");
    },
    [applyReady],
  );

  const refresh = useCallback(async () => {
    setError("");
    try {
      const status = await fetchAccessStatus();
      if (status.state === "ready" && status.operatorName) {
        applyReady(status.operatorName);
        return;
      }
      if (status.access.gateUnlocked) {
        await resolveAfterUnlock(status.access);
        return;
      }

      const local = getStoredOperatorName();
      if (isTrustedDevice() && local) {
        try {
          await unlockGate({ method: "shortcut" });
          const registered = await registerOperator(local);
          if (registered.displayName) {
            applyReady(registered.displayName);
            return;
          }
        } catch {
          // fall through to lock
        }
      }

      setOperatorName(null);
      setPhase("locked");
    } catch {
      const local = getStoredOperatorName();
      if (local) {
        setOperatorName(local);
        setPhase("offline");
        return;
      }
      setOperatorName(null);
      setPhase("locked");
    }
  }, [applyReady, resolveAfterUnlock]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlock = useCallback(
    async (options?: { method?: UnlockMethod; secret?: string }) => {
      setError("");
      const access = await unlockGate(options);
      await resolveAfterUnlock(access);
    },
    [resolveAfterUnlock],
  );

  const afterUnlock = useCallback(async () => {
    await unlock({ method: "shortcut" });
  }, [unlock]);

  const register = useCallback(
    async (name: string) => {
      setError("");
      const access = await registerOperator(name);
      if (!access.displayName) throw new Error("הרישום נכשל");
      applyReady(access.displayName);
      return access.displayName;
    },
    [applyReady],
  );

  useEffect(() => {
    if (phase !== "locked") return;

    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    let pressCount = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      event.preventDefault();

      pressCount += 1;
      if (pressCount >= REQUIRED_PRESSES) {
        void unlock({ method: "shortcut" }).catch((err) => {
          setError(err instanceof Error ? err.message : "פתיחה נכשלה");
        });
        pressCount = 0;
        return;
      }

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        pressCount = 0;
      }, RESET_MS);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(resetTimer);
    };
  }, [phase, unlock]);

  return {
    phase,
    operatorName,
    error,
    unlock,
    afterUnlock,
    register,
    refresh,
  };
}
