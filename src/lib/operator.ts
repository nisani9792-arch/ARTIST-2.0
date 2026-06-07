const OPERATOR_KEY = "artist20_operator_name";
const TRUSTED_KEY = "artist20_trusted_device";

export const getStoredOperatorName = (): string | null => {
  if (typeof localStorage === "undefined") return null;
  const name = localStorage.getItem(OPERATOR_KEY)?.trim();
  if (!name || name.length < 2) return null;
  return name.slice(0, 40);
};

export const setStoredOperatorName = (name: string): void => {
  const trimmed = name.trim().slice(0, 40);
  if (trimmed.length >= 2) {
    localStorage.setItem(OPERATOR_KEY, trimmed);
  }
};

export const isTrustedDevice = (): boolean =>
  typeof localStorage !== "undefined" &&
  localStorage.getItem(TRUSTED_KEY) === "1";

export const markTrustedDevice = (): void => {
  localStorage.setItem(TRUSTED_KEY, "1");
};
