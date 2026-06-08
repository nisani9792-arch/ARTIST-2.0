import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Maps to existing Neon `artists` table (ARTIST v1 schema + is_odoo_approved). */
export const artists = pgTable(
  "artists",
  {
    id: text("id").primaryKey(),
    nameHe: text("name_he").notNull(),
    status: text("status").notNull().default("unsigned"),
    owner: text("owner").notNull().default("לא שויך"),
    isOdooApproved: boolean("is_odoo_approved").notNull().default(false),
    songCount: integer("song_count").notNull().default(0),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("artists_status_idx").on(table.status),
    index("artists_owner_idx").on(table.owner),
    index("artists_name_he_idx").on(table.nameHe),
    index("artists_updated_at_idx").on(table.updatedAt),
  ],
);

export type ArtistRow = typeof artists.$inferSelect;
export type NewArtistRow = typeof artists.$inferInsert;

export const ipAccess = pgTable("ip_access", {
  ip: text("ip").primaryKey(),
  displayName: text("display_name"),
  gateUnlockedAt: timestamp("gate_unlocked_at", {
    withTimezone: true,
    mode: "string",
  }),
  registeredAt: timestamp("registered_at", {
    withTimezone: true,
    mode: "string",
  }),
  lastSeenAt: timestamp("last_seen_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .defaultNow(),
});
