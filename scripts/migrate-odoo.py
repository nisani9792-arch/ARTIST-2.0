import os
from pathlib import Path

import psycopg2

ROOT = Path(__file__).resolve().parents[1]
for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, value = line.partition("=")
    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = True
cur = conn.cursor()

cur.execute(
    "ALTER TABLE artists ADD COLUMN IF NOT EXISTS is_odoo_approved BOOLEAN NOT NULL DEFAULT false"
)

cur.execute("SELECT COUNT(*) FROM artists")
total = cur.fetchone()[0]
cur.execute(
    "SELECT COUNT(*) FROM artists WHERE status = 'signed' AND is_odoo_approved = false"
)
pending = cur.fetchone()[0]
print(f"total artists: {total}, signed pending odoo: {pending}")

cur.close()
conn.close()
print("done")
