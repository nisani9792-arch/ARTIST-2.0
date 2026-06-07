export const JUSIC_CODE = "JUSIC";

export function tryJusicCode(value: string): boolean {
  return value.trim().toUpperCase() === JUSIC_CODE;
}
