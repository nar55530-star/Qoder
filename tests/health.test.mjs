import assert from "node:assert/strict";
import test from "node:test";
import { emptyHealthBook, localDay, medicationStatus, recordTaken, undoTaken, readingValues, saveMedicationPlan } from "../src/lib/health.ts";

const morning = { id: "morning", name: "演示药品", time: "08:30", instructions: "照原记录" };
const day = new Date(2026, 10, 19, 21, 30);

test("按当地日期保存实际记录，重复点击只产生一条", () => {
  assert.equal(localDay(day), "2026-11-19");
  const once = recordTaken([], morning, day);
  assert.equal(recordTaken(once, morning, day).length, 1);
  assert.equal(medicationStatus(once, morning.id, "2026-11-20"), undefined);
  assert.equal(medicationStatus(once, morning.id, "2026-11-19").recordedAt, day.toISOString());
});

test("修改计划不改写旧记录，撤销也仅作用于指定日期", () => {
  const old = recordTaken([], morning, day);
  const nextDay = new Date(2026, 10, 20, 7);
  const next = recordTaken(old, { ...morning, time: "09:45" }, nextDay);
  assert.equal(medicationStatus(next, morning.id, localDay(day)).scheduledTime, "08:30");
  const afterUndo = undoTaken(next, morning.id, localDay(nextDay));
  assert.equal(afterUndo.length, 1);
  assert.equal(afterUndo[0].day, localDay(day));
});

test("已经记录服用后修改药品或时间，新计划不继承旧状态", () => {
  const book = { ...emptyHealthBook, plans: [morning], intakes: recordTaken([], morning, day) };
  const replacement = { ...morning, id: "new-morning", name: "另一项演示药品", time: "09:45" };
  const updated = saveMedicationPlan(book, replacement, morning.id, day);
  assert.deepEqual(updated.plans, [replacement]);
  assert.equal(medicationStatus(updated.intakes, replacement.id, localDay(day)), undefined);
  assert.equal(updated.intakes[0].name, morning.name);

  const unchanged = saveMedicationPlan(book, { ...morning, id: "unused" }, morning.id, day);
  assert.equal(unchanged.plans[0].id, morning.id);
});

test("血压和血糖保留各自的单位和字段，空白和非数字不保存", () => {
  assert.deepEqual(readingValues("pressure", "128", "76"), { kind: "pressure", systolic: 128, diastolic: 76 });
  assert.deepEqual(readingValues("glucose", "5.8", "76"), { kind: "glucose", glucose: 5.8 });
  assert.equal(readingValues("glucose", "", ""), null);
  assert.equal(readingValues("pressure", "abc", "76"), null);
  assert.equal(readingValues("pressure", "76", "128"), null);
});
