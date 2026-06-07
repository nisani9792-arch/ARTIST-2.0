import { JUSIC_CODE } from "./constants";

export type UnlockMethod = "password" | "shortcut" | "biometric";

export function verifyGateUnlock(body: {
  method?: string;
  secret?: string;
}): void {
  const secret = String(process.env.GATE_SECRET ?? JUSIC_CODE).trim();
  const method = String(body.method ?? "password").trim();

  if (method === "password") {
    const provided = String(body.secret ?? "").trim();
    if (!provided || provided.toUpperCase() !== secret.toUpperCase()) {
      throw new Error("Invalid gate secret");
    }
    return;
  }

  if (method === "shortcut") {
    if (process.env.GATE_ALLOW_SHORTCUT === "false") {
      throw new Error("Keyboard shortcut unlock is disabled");
    }
    return;
  }

  if (method === "biometric") {
    if (process.env.GATE_ALLOW_BIOMETRIC === "false") {
      throw new Error("Biometric unlock is disabled");
    }
    return;
  }

  throw new Error("Invalid unlock method");
}
