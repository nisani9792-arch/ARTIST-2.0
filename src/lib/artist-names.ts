/** Normalize Hebrew artist names for duplicate detection. */
const FINAL_TO_REGULAR: Record<string, string> = {
  "\u05DD": "\u05DE",
  "\u05DF": "\u05E0",
  "\u05DA": "\u05DB",
  "\u05E3": "\u05E4",
  "\u05E5": "\u05E6",
};

export function normalizeArtistName(value: string): string {
  let s = value.trim().toLowerCase();
  s = s.replace(/["'״''`]/g, "");
  s = s.replace(/[\u0591-\u05C7]/g, "");
  s = s.replace(/[\s\u00A0]+/g, " ");
  for (const [final, regular] of Object.entries(FINAL_TO_REGULAR)) {
    s = s.split(final).join(regular);
  }
  s = s.replace(/^ו[-]?/, "");
  s = s.replace(/[-–—]+/g, " ");
  return s.trim();
}

export function artistNameKey(name: string): string {
  return normalizeArtistName(name);
}

export function namesAreSimilar(a: string, b: string): boolean {
  const ka = artistNameKey(a);
  const kb = artistNameKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  if (ka.length >= 4 && kb.length >= 4) {
    return ka.includes(kb) || kb.includes(ka);
  }
  return false;
}
