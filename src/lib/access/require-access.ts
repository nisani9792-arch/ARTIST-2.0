import { NextResponse } from "next/server";
import { getClientIp } from "./client-ip";
import { getAccessByIp } from "./store";

export async function requireAccess(): Promise<
  { ok: true; operatorName: string } | { ok: false; response: NextResponse }
> {
  const ip = await getClientIp();
  const access = await getAccessByIp(ip);

  if (!access.displayName) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Operator registration required" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, operatorName: access.displayName };
}

export async function requireGateUnlocked(): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const ip = await getClientIp();
  const access = await getAccessByIp(ip);

  if (!access.gateUnlocked) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Gate is locked" }, { status: 403 }),
    };
  }

  return { ok: true };
}
