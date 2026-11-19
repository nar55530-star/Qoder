import type { Reading } from "./health.ts";
import { selectTrendReadings, type TrendSelection } from "./health-trends.ts";

type TrendSeries = {
  label: "高压" | "低压" | "血糖";
  unit: "mmHg" | "mmol/L";
  minimum: number;
  maximum: number;
  first: number;
  last: number;
};

function summarizeSeries(label: TrendSeries["label"], unit: TrendSeries["unit"], values: number[]): TrendSeries {
  let minimum = values[0];
  let maximum = values[0];
  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  return { label, unit, minimum, maximum, first: values[0], last: values[values.length - 1] };
}

export function summarizeHealthTrend(readings: Reading[], selection: TrendSelection, now = new Date()) {
  const filtered = selectTrendReadings(readings, selection, now);
  if (!filtered.length) return null;
  const { kind, window } = selection;
  if (kind === "pressure") {
    const values = filtered.filter((reading) => reading.kind === "pressure");
    return { kind, window, count: values.length, series: [
      summarizeSeries("高压", "mmHg", values.map((reading) => reading.systolic)),
      summarizeSeries("低压", "mmHg", values.map((reading) => reading.diastolic)),
    ] } as const;
  }
  const values = filtered.filter((reading) => reading.kind === "glucose");
  return { kind, window, count: values.length, mealContext: selection.mealContext ?? "unknown", series: [
    summarizeSeries("血糖", "mmol/L", values.map((reading) => reading.glucose)),
  ] } as const;
}
