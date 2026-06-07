"use client";

import { useCallback, useEffect, useState } from "react";
import {
  enterWithSavedOperator,
  fetchAccessStatus,
  getCachedOperatorName,
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

  const refresh = useCallback(async () => {
    setError("");
    const cached = getStoredOperatorName();

    try {
      const next = await fetchAccessStatus();
      if (next.state === "ready") {
        markTrustedDevice();
        setOperatorName(next.operatorName);
        setPhase("ready");
        return;
      }

      if (cached && isTrustedDevice()) {
        const entered = await enterWithSavedOperator(cached);
        setOperatorName(entered.operatorName);
        setPhase(entered.state);
        return;
      }

      setOperatorName(cached);
      setPhase("locked");
    } catch {
      if (cached) {
        setOperatorName(cached);
        setPhase("offline");
        return;
      }
      setOperatorName(null);
      setPhase("locked");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const afterUnlock = useCallback(async () => {
    setPhase("loading");
    const cached = getCachedOperatorName();
    if (cached) {
      const entered = await enterWithSavedOperator(cached);
      setOperatorName(entered.operatorName);
      setPhase(entered.state);
      return;
    }
    setOperatorName(null);
    setPhase("register");
  }, []);

  const register = useCallback(async (name: string) => {
    setError("");
    const trimmed = name.trim();
    const registered = await enterWithSavedOperator(trimmed);
    if (registered.state !== "ready") {
      throw new Error("הרישום נכשל");
    }
    setStoredOperatorName(registered.operatorName);
    setOperatorName(registered.operatorName);
    setPhase("ready");
    return registered.operatorName;
  }, []);

  useEffect(() => {
    if (phase !== "locked") return;

    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    let pressCount = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      event.preventDefault();

      pressCount += 1;
      if (pressCount >= REQUIRED_PRESSES) {
        void afterUnlock();
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
  }, [phase, afterUnlock]);

  return {
    phase,
    operatorName,
    error,
    afterUnlock,
    register,
    refresh,
  };
}
