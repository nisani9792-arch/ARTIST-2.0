/** Normalize artist id from URL paths, JSON bodies, or drag payloads. */
export function normalizeArtistId(raw: string): string {
  let id = raw.trim();
  if (!id) return id;
  try {
    // Decode repeatedly in case of double-encoding (proxies, copy-paste).
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(id);
      if (next === id) break;
      id = next;
    }
  } catch {
    /* keep raw */
  }
  return id;
}

export function encodeArtistIdForPath(id: string): string {
  return encodeURIComponent(normalizeArtistId(id));
}
