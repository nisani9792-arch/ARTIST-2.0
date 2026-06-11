import { artistNameKey } from "./artist-names";
import { listArtists, mergeArtistsIntoKeep, type DuplicateGroup } from "./artists";

export type { DuplicateGroup };

export async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  const artists = await listArtists(undefined, false, "all");
  const groups = new Map<string, DuplicateGroup>();

  for (const artist of artists) {
    const key = artistNameKey(artist.name);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.artists.push(artist);
    } else {
      groups.set(key, { key, name: artist.name, artists: [artist] });
    }
  }

  return [...groups.values()]
    .filter((g) => g.artists.length > 1)
    .map((g) => ({
      ...g,
      artists: [...g.artists].sort(
        (a, b) =>
          new Date(b.lastActionTimestamp).getTime() -
          new Date(a.lastActionTimestamp).getTime(),
      ),
    }))
    .sort((a, b) => b.artists.length - a.artists.length);
}

export async function mergeDuplicateArtists(
  keepId: string,
  removeIds: string[],
): Promise<{ artistId: string; merged: number }> {
  const artist = await mergeArtistsIntoKeep(keepId, removeIds);
  return { artistId: artist.id, merged: removeIds.length };
}

export async function scanNamesForDuplicates(
  names: string[],
): Promise<Array<{ input: string; matches: string[] }>> {
  const artists = await listArtists(undefined, false, "all");
  const byKey = new Map<string, string[]>();
  for (const artist of artists) {
    const key = artistNameKey(artist.name);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(artist.name);
    byKey.set(key, list);
  }

  const results: Array<{ input: string; matches: string[] }> = [];
  for (const name of names) {
    const key = artistNameKey(name);
    const matches = byKey.get(key) ?? [];
    if (matches.length > 0) {
      results.push({ input: name, matches });
    }
  }
  return results;
}
