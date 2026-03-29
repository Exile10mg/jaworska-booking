import { and, asc, eq, gte } from "drizzle-orm";

import { getDb } from "@/db/client";
import { availabilitySlots } from "@/db/schema";

export type AvailabilityMap = Record<string, string[]>;

export type AvailabilityDay = {
  date: string;
  slots: string[];
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMinutesFromTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function normalizeDateKey(value: string) {
  const normalized = value.trim();

  if (!datePattern.test(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizeTimeValue(value: string) {
  const normalized = value.trim();

  if (!timePattern.test(normalized)) {
    return null;
  }

  const [hour, minute] = normalized.split(":").map(Number);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function buildSlotsFromRange(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
) {
  const startMinutes = getMinutesFromTime(startTime);
  const endMinutes = getMinutesFromTime(endTime);

  if (
    !Number.isInteger(intervalMinutes) ||
    intervalMinutes <= 0 ||
    endMinutes < startMinutes
  ) {
    return [];
  }

  const slots: string[] = [];

  for (
    let currentMinutes = startMinutes;
    currentMinutes <= endMinutes;
    currentMinutes += intervalMinutes
  ) {
    const hour = String(Math.floor(currentMinutes / 60)).padStart(2, "0");
    const minute = String(currentMinutes % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }

  return slots;
}

export async function getAvailabilityMap({
  fromDate,
}: {
  fromDate?: string;
} = {}): Promise<AvailabilityMap> {
  const todayKey = fromDate ?? toDateKey(new Date());
  try {
    const db = getDb();
    const slotRows = await db
      .select({
        date: availabilitySlots.slotDate,
        time: availabilitySlots.slotTime,
      })
      .from(availabilitySlots)
      .where(gte(availabilitySlots.slotDate, todayKey))
      .orderBy(asc(availabilitySlots.slotDate), asc(availabilitySlots.slotTime));
    const availabilityMap: AvailabilityMap = {};

    for (const slot of slotRows) {
      if (!availabilityMap[slot.date]) {
        availabilityMap[slot.date] = [];
      }

      availabilityMap[slot.date].push(slot.time);
    }

    return availabilityMap;
  } catch (error) {
    console.error("getAvailabilityMap error:", error);
    return {};
  }
}

export async function getAvailabilityDays({
  fromDate,
}: {
  fromDate?: string;
} = {}): Promise<AvailabilityDay[]> {
  const todayKey = fromDate ?? toDateKey(new Date());
  try {
    const db = getDb();
    const slotRows = await db
      .select({
        date: availabilitySlots.slotDate,
        time: availabilitySlots.slotTime,
      })
      .from(availabilitySlots)
      .where(gte(availabilitySlots.slotDate, todayKey))
      .orderBy(asc(availabilitySlots.slotDate), asc(availabilitySlots.slotTime));

    const days = new Map<string, string[]>();

    for (const row of slotRows) {
      const current = days.get(row.date) ?? [];
      current.push(row.time);
      days.set(row.date, current);
    }

    return Array.from(days.entries()).map(([date, slots]) => ({
      date,
      slots,
    }));
  } catch (error) {
    console.error("getAvailabilityDays error:", error);
    return [];
  }
}

export async function isSlotCurrentlyAvailable(date: string, time: string) {
  try {
    const db = getDb();

    const [slotRow] = await db
      .select({ id: availabilitySlots.id })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.slotDate, date),
          eq(availabilitySlots.slotTime, time),
        ),
      )
      .limit(1);

    return Boolean(slotRow);
  } catch (error) {
    console.error("isSlotCurrentlyAvailable error:", error);
    return false;
  }
}
