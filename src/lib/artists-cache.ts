import type { Artist, ArtistStats } from "./types";

const CACHE_KEY = "artist-data-cache-v1";

type CachedPayload = {
  at: string;
  artists: Artist[];
  stats: ArtistStats;
  search: string;
};

export function saveArtistsCache(search: string, artists: Artist[], stats: ArtistStats): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedPayload = {
      at: new Date().toISOString(),
      artists,
      stats,
      search,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function loadArtistsCache(search: string): CachedPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (parsed.search !== search) return null;
    return parsed;
  } catch {
    return null;
  }
}
