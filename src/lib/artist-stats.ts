import type { Artist } from "./types";

export function countOdooPending(artists: Pick<Artist, "status" | "isOdooApproved">[]): number {
  return artists.filter((a) => a.status === "signed" && !a.isOdooApproved).length;
}
