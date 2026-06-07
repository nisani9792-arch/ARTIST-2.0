import { getSql } from "@/lib/db";

export type AccessRecord = {
  gateUnlocked: boolean;
  displayName: string | null;
};

export type AccessStatus = {
  state: "ready" | "locked";
  operatorName: string | null;
  auth: "ip" | null;
};

type IpAccessRow = {
  display_name: string | null;
  gate_unlocked_at: string | null;
};

const normalize = (row?: IpAccessRow | null): AccessRecord => ({
  gateUnlocked: Boolean(row?.gate_unlocked_at),
  displayName: row?.display_name ?? null,
});

export function toStatus(access: AccessRecord): AccessStatus {
  if (access.displayName) {
    return { state: "ready", operatorName: access.displayName, auth: "ip" };
  }
  return { state: "locked", operatorName: null, auth: null };
}

export async function getAccessByIp(ip: string): Promise<AccessRecord> {
  const sql = getSql();
  const rows = await sql`
    UPDATE ip_access
    SET last_seen_at = NOW()
    WHERE ip = ${ip}
    RETURNING display_name, gate_unlocked_at
  `;

  if (rows[0]) return normalize(rows[0] as IpAccessRow);
  return { gateUnlocked: false, displayName: null };
}

export async function unlockGateForIp(ip: string): Promise<AccessRecord> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO ip_access (ip, gate_unlocked_at, last_seen_at)
    VALUES (${ip}, NOW(), NOW())
    ON CONFLICT (ip) DO UPDATE SET
      gate_unlocked_at = COALESCE(ip_access.gate_unlocked_at, EXCLUDED.gate_unlocked_at),
      last_seen_at = NOW()
    RETURNING display_name, gate_unlocked_at
  `;

  return normalize(rows[0] as IpAccessRow | undefined);
}

export async function registerOperatorForIp(
  ip: string,
  displayName: string,
): Promise<AccessRecord> {
  const name = displayName.trim();
  if (name.length < 2 || name.length > 40) {
    throw new Error("Invalid display name");
  }

  const sql = getSql();
  const rows = await sql`
    INSERT INTO ip_access (ip, display_name, gate_unlocked_at, registered_at, last_seen_at)
    VALUES (${ip}, ${name}, NOW(), NOW(), NOW())
    ON CONFLICT (ip) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      gate_unlocked_at = COALESCE(ip_access.gate_unlocked_at, EXCLUDED.gate_unlocked_at),
      registered_at = COALESCE(ip_access.registered_at, EXCLUDED.registered_at),
      last_seen_at = NOW()
    RETURNING display_name, gate_unlocked_at
  `;

  const row = rows[0] as IpAccessRow | undefined;
  if (!row?.display_name) {
    throw new Error("Registration failed");
  }

  return normalize(row);
}
