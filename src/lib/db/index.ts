import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function parseDbHost(url: string): string {
  try {
    return new URL(url.replace(/^postgresql:\/\//, "http://")).hostname;
  } catch {
    return "invalid";
  }
}

function getDatabaseUrl(): string {
  // ARTIST_DATABASE_URL overrides system DATABASE_URL (Windows often has localhost)
  const raw =
    process.env.ARTIST_DATABASE_URL?.trim().replace(/^"|"$/g, "") ||
    process.env.DATABASE_URL?.trim().replace(/^"|"$/g, "") ||
    "";
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
  const cleaned = raw
    .replace(/[&?]channel_binding=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/\?$/, "");

  const host = parseDbHost(cleaned);
  if (host === "localhost" || host === "127.0.0.1") {
    throw new Error(
      "DATABASE_URL points to localhost — set Neon URL in Render Environment Variables",
    );
  }

  return cleaned;
}

let sqlClient: ReturnType<typeof postgres> | null = null;

/** Raw SQL client — lazy init so env vars are available at request time. */
export function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(getDatabaseUrl(), {
      ssl: "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return sqlClient;
}

type AppDb = PostgresJsDatabase<typeof schema>;

let dbInstance: AppDb | null = null;

function getDbInstance(): AppDb {
  if (!dbInstance) {
    dbInstance = drizzle(getSql(), { schema });
  }
  return dbInstance;
}

/** Lazy Drizzle client — do not connect at module import time. */
export const db = new Proxy({} as AppDb, {
  get(_target, prop) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
