# Legacy → ARTIST Domain Mapping

Source: `gemini-code-1780934353268.html` (JUSIC ELITE PRO)

## Status (3 values)

| Legacy | Target |
|--------|--------|
| `none` | `unsigned` (Vault) |
| `failed` | `in_process` |
| `signed` | `signed` |
| `rejected` | `unsigned` (merged) |

## Fields

| Legacy | ARTIST |
|--------|--------|
| `name` | `nameHe` |
| `handler` | `owner` |
| `odooApproved` | `isOdooApproved` |
| `tag` | `tags[]` |
| `category` | **deprecated** — not used in UI |

## Kanban

- Legacy: columns by `category` (popular/rest/indie) — **not migrated**
- New: main board `in_process` | `signed`; `unsigned` in Vault
