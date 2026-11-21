import assert from "node:assert/strict";
import test from "node:test";
import { emptyHealthBook, removeReading, saveReading } from "../src/lib/health.ts";
import { applyVisitNotesEdits, buildVisitSummary, formatVisitSummary } from "../src/lib/health-visit.ts";

const today = new Date(2026, 10, 21, 14, 30);
const pressure = {
  id: "pressure-1", kind: "pressure", systolic: 127, diastolic: 81, note: "坐着测量",
  measuredAt: new Date(2026, 10, 20, 9, 5).toISOString(),
};
const glucose = { id: "glucose-1", kind: "glucose", glucose: 5.6, note: "", measuredAt: new Date(2026, 10, 20, 8).toISOString() };
const book = {
  ...emptyHealthBook,
  plans: [
    { id: "evening", name: "示例晚间药品", time: "20:00", instructions: "" },
    { id: "morning", name: "示例早间药品", time: "08:00", instructions: "原医嘱备注" },
  ],
  readings: [
    glucose, pressure,
    { ...pressure, id: "boundary", measuredAt: new Date(2026, 10, 15, 0, 0).toISOString() },
    { ...pressure, id: "older", measuredAt: new Date(2026, 10, 14, 23, 59).toISOString() },
    { ...pressure, id: "future", measuredAt: new Date(2026, 10, 21, 16).toISOString() },
    { ...glucose, id: "invalid", glucose: -1 },
  ],
};

test("复诊清单按当地日期整理用药与有效测量，兼容旧版血糖记录", () => {
  const summary = buildVisitSummary(book, 7, today);
  assert.equal(summary.from, "2026-11-15");
  assert.equal(summary.through, "2026-11-21");
  assert.deepEqual(summary.plans.map(({ id }) => id), ["morning", "evening"]);
  assert.deepEqual(summary.readings.map(({ id }) => id), ["pressure-1", "glucose-1", "boundary"]);
  assert.equal(buildVisitSummary(book, 30, today).readings.length, 4);
  const text = formatVisitSummary(summary, { concerns: "近几天的情况", questions: "何时复查？" });
  assert.match(text, /2026-11-20 09:05.*127 \/ 81 mmHg.*坐着测量/);
  assert.match(text, /血糖（未注明）.*5\.6 mmol\/L/);
  assert.match(text, /08:00.*示例早间药品.*原医嘱备注/);
  assert.match(text, /近几天的情况[\s\S]*何时复查？/);
  assert.doesNotMatch(text, /pressure-1|glucose-1|2026-11-14/);
});

test("更正读数保留同一条记录，后续查看和曲线使用新值", () => {
  const updated = saveReading(book, { ...pressure, systolic: 123 }, pressure);
  assert.equal(updated.readings.length, book.readings.length);
  assert.equal(updated.readings.find(({ id }) => id === pressure.id).systolic, 123);
  assert.equal(buildVisitSummary(updated, 7, today).readings[0].systolic, 123);
  assert.equal(pressure.systolic, 127);
});

test("拒绝用旧表单覆盖另一页面刚修改或删除的测量", () => {
  const changed = saveReading(book, { ...pressure, note: "另一窗口的备注" }, pressure);
  assert.throws(() => saveReading(changed, { ...pressure, systolic: 120 }, pressure), { name: "ReadingChangedError" });
  assert.throws(() => saveReading(emptyHealthBook, pressure, pressure), { name: "ReadingChangedError" });
});

test("旧的删除确认不会移除刚被另一页面修改的读数", () => {
  const revised = { ...pressure, systolic: 120 };
  const changed = saveReading(book, revised, pressure);
  assert.throws(() => removeReading(changed, pressure), { name: "ReadingChangedError" });
  assert.equal(removeReading(changed, revised).readings.some(({ id }) => id === pressure.id), false);
});

test("就诊笔记合并独立修改，并阻止覆盖另一页面对同一栏的修改", () => {
  const changed = { ...book, visitNotes: { concerns: "原有情况", questions: "另一页的最新问题" } };
  const edited = applyVisitNotesEdits(changed, { concerns: { original: "原有情况", value: "  我的补充  " } });
  assert.deepEqual(edited.visitNotes, { concerns: "我的补充", questions: "另一页的最新问题" });
  assert.throws(() => applyVisitNotesEdits(changed, { questions: { original: "原有问题", value: "旧页的新输入" } }),
    { name: "VisitNotesChangedError" });
});
