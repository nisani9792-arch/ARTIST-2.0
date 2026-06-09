import {
  getStoredOperatorName,
  markTrustedDevice,
  setStoredOperatorName,
} from "@/lib/operator";

export type AccessStatus =
  | { state: "locked"; operatorName: string | null }
  | { state: "ready"; operatorName: string; auth?: "ip" | "session" | null };

const ACCESS_FETCH_TIMEOUT_MS = 8000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ACCESS_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" && data.error ? data.error : "בקשה נכשלה",
    );
  }
  return data as T;
}

export const fetchAccessStatus = async (): Promise<AccessStatus> => {
  const data = await request<AccessStatus>("/api/access/status");
  if (data.state === "ready" && data.operatorName) {
    setStoredOperatorName(data.operatorName);
    return data;
  }
  return { state: "locked", operatorName: null };
};

export const registerOperator = async (operatorName: string): Promise<string> => {
  const data = await request<{ operatorName?: string }>("/api/access/register", {
    method: "POST",
    body: JSON.stringify({ operatorName: operatorName.trim() }),
  });
  const name = data.operatorName?.trim();
  if (!name) {
    throw new Error("רישום נכשל — לא התקבל שם מפעיל מהשרת");
  }
  setStoredOperatorName(name);
  return name;
};

const isBrowserOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

/** Auto-sync saved name with server; offline only when browser is offline. */
export const enterWithSavedOperator = async (
  cachedName: string,
): Promise<
  | { state: "ready"; operatorName: string }
  | { state: "offline"; operatorName: string }
  | { state: "degraded"; operatorName: string }
> => {
  try {
    const name = await registerOperator(cachedName);
    markTrustedDevice();
    return { state: "ready", operatorName: name };
  } catch {
    markTrustedDevice();
    if (isBrowserOffline()) {
      return { state: "offline", operatorName: cachedName };
    }
    return { state: "degraded", operatorName: cachedName };
  }
};

export const getCachedOperatorName = () => getStoredOperatorName();
