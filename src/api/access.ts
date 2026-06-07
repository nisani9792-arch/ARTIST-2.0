export type AccessState = {
  gateUnlocked: boolean;
  displayName: string | null;
};

export type AccessStatusResponse = {
  state: "ready" | "locked";
  operatorName: string | null;
  auth: "ip" | null;
  access: AccessState;
};

export type UnlockMethod = "password" | "shortcut" | "biometric";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "בקשה נכשלה");
  }
  return data as T;
}

export const fetchAccessStatus = () =>
  request<AccessStatusResponse>("/api/access/status");

export const unlockGate = (options?: { method?: UnlockMethod; secret?: string }) =>
  request<{ access: AccessState }>("/api/access/unlock", {
    method: "POST",
    body: JSON.stringify({
      method: options?.method ?? "password",
      secret: options?.secret,
    }),
  }).then((r) => r.access);

export const registerOperator = (displayName: string) =>
  request<{ access: AccessState }>("/api/access/register", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  }).then((r) => r.access);
