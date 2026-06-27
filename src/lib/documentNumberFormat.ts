/**
 * Documents should show student enrollment/registration counters without legacy prefixes.
 * Examples: "REG-1" -> "1", "ATC-ST-0001" -> "1", "ATC-ST-26-0001" -> "1".
 */
export function plainDocumentNumber(value: string | number | null | undefined): string {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  const trailingNumber = raw.match(/(\d+)\s*$/)?.[1];
  if (!trailingNumber) return raw;

  const normalized = String(Number.parseInt(trailingNumber, 10));
  return normalized === "NaN" ? trailingNumber : normalized;
}
