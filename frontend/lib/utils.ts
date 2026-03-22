import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date that may arrive as an ISO string or a Java LocalDateTime
 * array: [year, month, day, hour, minute, second, nano].
 * Returns null for unparseable values.
 */
export function parseDate(
  value: string | number[] | null | undefined,
): Date | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
