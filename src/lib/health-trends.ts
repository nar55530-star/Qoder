import type { MealContext, Reading } from "./health";

export type TrendKind = Reading["kind"];
export type TrendWindow = 7 | 30 | 90 | "all";
export type TrendSelection = { kind: TrendKind; window: TrendWindow; mealContext?: MealContext };

function readingTime(reading: Reading): number {
  return typeof reading.measuredAt === "string" ? Date.parse(reading.measuredAt) : NaN;
}

function glucoseContext(context?: MealContext): MealContext {
  return context === "fasting" || context === "after-meal" ? context : "unknown";
}

function isGlucoseValue(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function latestGlucoseMealContext(readings: Reading[], now = new Date()): MealContext {
  let context: MealContext = "unknown";
  let latest = -Infinity;
  const currentTime = now.getTime();

  for (const reading of readings) {
    if (reading?.kind !== "glucose" || !isGlucoseValue(reading.glucose)) continue;
    const timestamp = readingTime(reading);
    if (timestamp > latest && timestamp <= currentTime) {
      latest = timestamp;
      context = glucoseContext(reading.mealContext);
    }
  }

  return context;
}

export function readingWindowStart(days: number, now: Date) {
  const firstDay = new Date(now);
  firstDay.setHours(0, 0, 0, 0);
  firstDay.setDate(firstDay.getDate() - days + 1);
  return firstDay;
}

export function selectRecentReadings(readings: Reading[], window: TrendWindow, now = new Date()): Reading[] {
  const earliest = window === "all" ? -Infinity : readingWindowStart(window, now).getTime();
  const latest = now.getTime();
  return readings.flatMap((reading) => {
    if (reading?.kind !== "pressure" && reading?.kind !== "glucose") return [];
    const timestamp = readingTime(reading);
    if (!Number.isFinite(timestamp) || timestamp < earliest || timestamp > latest) return [];

    if (reading.kind === "pressure") {
      const { systolic, diastolic } = reading;
      if (!Number.isInteger(systolic) || !Number.isInteger(diastolic) || diastolic <= 0 || systolic <= diastolic) return [];
    } else if (!isGlucoseValue(reading.glucose)) {
      return [];
    }
    return [{ reading, timestamp }];
  }).sort((first, second) => first.timestamp - second.timestamp).map(({ reading }) => reading);
}

export function selectTrendReadings(readings: Reading[], selection: TrendSelection, now = new Date()): Reading[] {
  const context = selection.mealContext ?? "unknown";
  return selectRecentReadings(readings, selection.window, now).filter((reading) => reading.kind === selection.kind
    && (reading.kind === "pressure" || glucoseContext(reading.mealContext) === context));
}
