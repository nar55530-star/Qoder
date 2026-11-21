import assert from "node:assert/strict";
import test from "node:test";
import { buildMedicationCalendar, medicationReminderTimes } from "../src/lib/health-reminders.ts";

const now = new Date(2026, 11, 31, 16, 30);
const plans = [
  { id: "evening", name: "演示药一", time: "20:00", instructions: "私密备注" },
  { id: "morning", name: "演示药二", time: "08:30", instructions: "" },
  { id: "same-time", name: "演示药三", time: "08:30", instructions: "" },
  { id: "bad-time", name: "旧数据", time: "25:00", instructions: "" },
];

test("用药提醒按时间去重、排序，并过滤无效的旧数据", () => {
  assert.deepEqual(medicationReminderTimes(plans), ["08:30", "20:00"]);
  assert.equal(buildMedicationCalendar([plans[3]], now), null);
});

test("日历用本地时间从次日开始重复 30 天，只有时间和通用标题", () => {
  const file = buildMedicationCalendar(plans, now);
  const blocks = file.split("BEGIN:VEVENT\r\n").slice(1);
  assert.equal(blocks.length, 2);
  assert.match(blocks[0], /DTSTART:20270101T083000\r\n/);
  assert.match(blocks[1], /DTSTART:20270101T200000\r\n/);
  for (const block of blocks) assert.match(block, /RRULE:FREQ=DAILY;COUNT=30\r\n[\s\S]*TRIGGER:PT0M\r\n/);
  assert.match(file, /^BEGIN:VCALENDAR\r\n[\s\S]*END:VCALENDAR\r\n$/);
  assert.doesNotMatch(file, /演示药|私密备注|250000/);
});
