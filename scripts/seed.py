"""Seed Neon DB with artists from scripts/seed-data.json"""
import json
import os
import sys
from pathlib import Path

import psycopg2

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
DATA_PATH = ROOT / "scripts" / "seed-data.json"


def load_env():
    if not ENV_PATH.exists():
        raise SystemExit(".env not found")
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


def main():
    load_env()
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL missing")

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    signed = data["signed"]
    unsigned = data["unsigned"]

    conn = psycopg2.connect(url)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS artists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          is_signed BOOLEAN NOT NULL DEFAULT false,
          is_odoo_approved BOOLEAN NOT NULL DEFAULT false,
          handler_name TEXT NOT NULL DEFAULT 'לא שויך',
          last_action_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    cur.execute(
        "ALTER TABLE artists ADD COLUMN IF NOT EXISTS is_odoo_approved BOOLEAN NOT NULL DEFAULT false"
    )
    cur.execute("CREATE INDEX IF NOT EXISTS artists_is_signed_idx ON artists (is_signed)")
    cur.execute("CREATE INDEX IF NOT EXISTS artists_handler_name_idx ON artists (handler_name)")
    cur.execute("CREATE INDEX IF NOT EXISTS artists_name_idx ON artists (name)")
    cur.execute(
        "CREATE INDEX IF NOT EXISTS artists_last_action_idx ON artists (last_action_timestamp)"
    )

    cur.execute("TRUNCATE TABLE artists")

    def insert_batch(names, is_signed):
        for name in names:
            cur.execute(
                """
                INSERT INTO artists (name, is_signed, handler_name, last_action_timestamp)
                VALUES (%s, %s, 'לא שויך', now())
                """,
                (name, is_signed),
            )

    insert_batch(signed, True)
    insert_batch(unsigned, False)

    cur.execute("SELECT COUNT(*) FROM artists WHERE is_signed = true")
    signed_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM artists WHERE is_signed = false")
    unsigned_count = cur.fetchone()[0]

    cur.close()
    conn.close()

    print(f"Seeded {signed_count} signed + {unsigned_count} unsigned = {signed_count + unsigned_count} total")


if __name__ == "__main__":
    main()
