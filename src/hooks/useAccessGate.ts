"use client";

import { useCallback, useEffect, useState } from "react";
import {
  enterWithSavedOperator,
  fetchAccessStatus,
  getCachedOperatorName,
  registerOperator,
} from "@/api/access";
import {
  getStoredOperatorName,
  isTrustedDevice,
  markTrustedDevice,
  setStoredOperatorName,
} from "@/lib/operator";

const RESET_MS = 1600;
const REQUIRED_PRESSES = 3;
const MAX_RETRIES = 2;

export type AccessPhase = "loading" | "locked" | "register" | "ready" | "offline" | "degraded";

const isBrowserOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

async function fetchWithRetry(): Promise<Awaited<ReturnType<typeof fetchAccessStatus>>> {
  let lastError: unknown;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fetchAccessStatus();
    } catch (err) {
      lastError = err;
      if (isBrowserOffline()) throw err;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastError;
}

export function useAccessGate() {
  const [phase, setPhase] = useState<AccessPhase>("loading");
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    const cached = getStoredOperatorName();

    try {
      const next = await fetchWithRetry();
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
      if (!cached) {
        setOperatorName(null);
        setPhase("locked");
        return;
      }
      setOperatorName(cached);
      if (isBrowserOffline()) {
        setPhase("offline");
      } else {
        setPhase("degraded");
      }
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
    try {
      const registeredName = await registerOperator(trimmed);
      markTrustedDevice();
      setStoredOperatorName(registeredName);
      setOperatorName(registeredName);
      setPhase("ready");
      return registeredName;
    } catch (err) {
      const message = err instanceof Error ? err.message : "הרישום נכשל";
      setError(message);
      throw new Error(message);
    }
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
