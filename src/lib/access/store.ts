import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ipAccess } from "@/lib/db/schema";

export type AccessRecord = {
  gateUnlocked: boolean;
  displayName: string | null;
};

export type AccessStatus = {
  state: "ready" | "locked";
  operatorName: string | null;
  auth: "ip" | null;
};

const normalize = (row?: {
  displayName: string | null;
  gateUnlockedAt: string | null;
}): AccessRecord => ({
  gateUnlocked: Boolean(row?.gateUnlockedAt),
  displayName: row?.displayName ?? null,
});

export function toStatus(access: AccessRecord): AccessStatus {
  if (access.gateUnlocked && access.displayName) {
    return { state: "ready", operatorName: access.displayName, auth: "ip" };
  }
  return { state: "locked", operatorName: access.displayName, auth: null };
}

export async function getAccessByIp(ip: string): Promise<AccessRecord> {
  const [touched] = await db
    .update(ipAccess)
    .set({ lastSeenAt: new Date().toISOString() })
    .where(eq(ipAccess.ip, ip))
    .returning({
      displayName: ipAccess.displayName,
      gateUnlockedAt: ipAccess.gateUnlockedAt,
    });

  if (touched) return normalize(touched);
  return { gateUnlocked: false, displayName: null };
}

export async function unlockGateForIp(ip: string): Promise<AccessRecord> {
  const existing = await db
    .select()
    .from(ipAccess)
    .where(eq(ipAccess.ip, ip))
    .limit(1);

  const now = new Date().toISOString();

  if (existing[0]) {
    const [row] = await db
      .update(ipAccess)
      .set({
        gateUnlockedAt: existing[0].gateUnlockedAt ?? now,
        lastSeenAt: now,
      })
      .where(eq(ipAccess.ip, ip))
      .returning({
        displayName: ipAccess.displayName,
        gateUnlockedAt: ipAccess.gateUnlockedAt,
      });
    return normalize(row);
  }

  const [row] = await db
    .insert(ipAccess)
    .values({
      ip,
      gateUnlockedAt: now,
      lastSeenAt: now,
    })
    .returning({
      displayName: ipAccess.displayName,
      gateUnlockedAt: ipAccess.gateUnlockedAt,
    });

  return normalize(row);
}

export async function registerOperatorForIp(
  ip: string,
  displayName: string,
): Promise<AccessRecord> {
  const name = displayName.trim();
  if (name.length < 2 || name.length > 40) {
    throw new Error("Invalid display name");
  }

  const [row] = await db
    .update(ipAccess)
    .set({
      displayName: name,
      registeredAt: sql`COALESCE(${ipAccess.registeredAt}, now())`,
      lastSeenAt: new Date().toISOString(),
    })
    .where(eq(ipAccess.ip, ip))
    .returning({
      displayName: ipAccess.displayName,
      gateUnlockedAt: ipAccess.gateUnlockedAt,
    });

  if (!row?.gateUnlockedAt) {
    throw new Error("Gate is locked");
  }

  return normalize(row);
}
