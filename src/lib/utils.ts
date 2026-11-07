import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats any UTC/ISO date string to Beirut local time (Asia/Beirut) in 12-hour format with AM/PM
 * Example: 2026-11-07T13:56:00Z -> "07/11/2026, 3:56 PM"
 */
export function formatBeirutDateTime(dateInput: string | Date | number): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Beirut",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Reformat to dd/MM/yyyy h:mm a
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const day = partMap.day || "01";
  const month = partMap.month || "01";
  const year = partMap.year || "2026";
  const hour = partMap.hour || "12";
  const minute = partMap.minute || "00";
  const dayPeriod = (partMap.dayPeriod || "AM").toUpperCase();

  return `${day}/${month}/${year} ${hour}:${minute} ${dayPeriod}`;
}

