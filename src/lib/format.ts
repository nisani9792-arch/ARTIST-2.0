export function formatHebrewDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function statusLabel(isSigned: boolean): string {
  return isSigned ? "חתום" : "לא חתום";
}
