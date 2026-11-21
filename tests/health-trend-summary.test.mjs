import assert from "node:assert/strict";
import test from "node:test";
import { summarizeHealthTrend } from "../src/lib/health-trend-summary.ts";

test("trend requests use only selected, ordered numeric summaries", () => {
  const entry = (day, glucose, mealContext) => ({ kind: "glucose", id: `private-${day}`, glucose, mealContext,
    measuredAt: `2026-11-${day}T08:00:00.000Z`, note: "private note" });
  const records = [entry(18, 6.4, "fasting"), entry(16, 5.9, "fasting"), entry(17, 7.0, "after-meal"), entry(15, 5.2)];
  assert.deepEqual(summarizeHealthTrend(records, { kind: "glucose", window: 7, mealContext: "fasting" }, new Date("2026-11-19T00:00:00Z")), {
    kind: "glucose", window: 7, count: 2, mealContext: "fasting",
    series: [{ label: "血糖", unit: "mmol/L", minimum: 5.9, maximum: 6.4, first: 5.9, last: 6.4 }],
  });
});
