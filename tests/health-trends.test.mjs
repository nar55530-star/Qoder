import assert from "node:assert/strict";
import test from "node:test";
import { latestGlucoseMealContext, selectTrendReadings } from "../src/lib/health-trends.ts";

const now = new Date(2026, 10, 19, 18);
const at = (daysAgo, hour = 0) => new Date(2026, 10, 19 - daysAgo, hour).toISOString();
const pressure = (id, measuredAt) => ({ id, kind: "pressure", measuredAt, systolic: 128, diastolic: 76, note: "" });
const glucose = (id, mealContext) => ({ id, kind: "glucose", measuredAt: at(1), glucose: 5.8, mealContext, note: "" });

test("按当地日历筛选历史测量，同一天的记录按测量时间排序", () => {
  const readings = [
    pressure("今天", at(0, 9)), pressure("七天前", at(7, 23)), pressure("前天早上", at(2, 8)),
    pressure("六天前", at(6)), pressure("前天下午", at(2, 16)), pressure("两月前", at(60)),
    pressure("更早", at(95)), pressure("未来", at(0, 21)),
  ];
  const select = (window) => selectTrendReadings(readings, { kind: "pressure", window }, now).map(({ id }) => id);

  assert.deepEqual(select(7), ["六天前", "前天早上", "前天下午", "今天"]);
  assert.deepEqual(select(30), ["七天前", "六天前", "前天早上", "前天下午", "今天"]);
  assert.deepEqual(select(90), ["两月前", "七天前", "六天前", "前天早上", "前天下午", "今天"]);
  assert.deepEqual(select("all"), ["更早", "两月前", "七天前", "六天前", "前天早上", "前天下午", "今天"]);
});

test("空腹、餐后和旧版未标注血糖各自显示", () => {
  const readings = [
    glucose("空腹记录", "fasting"), glucose("餐后记录", "after-meal"),
    glucose("旧版记录"), glucose("未标注记录", "unknown"), pressure("血压记录", at(0)),
  ];
  const select = (mealContext) => selectTrendReadings(readings, { kind: "glucose", window: 7, mealContext }, now).map(({ id }) => id);

  assert.deepEqual(select("fasting"), ["空腹记录"]);
  assert.deepEqual(select("after-meal"), ["餐后记录"]);
  assert.deepEqual(select("unknown"), ["旧版记录", "未标注记录"]);
  assert.deepEqual(select(), ["旧版记录", "未标注记录"]);
});

test("历史数据的日期或读数无效时不进入曲线", () => {
  const readings = [
    null, pressure("错误时间", "invalid-date"), pressure("有效血压", at(0)),
    { ...pressure("高低压颠倒", at(0)), diastolic: 130 },
    { ...pressure("字符串血压", at(0)), systolic: "128" },
    { ...glucose("无效血糖值"), glucose: Infinity }, glucose("有效血糖"),
  ];
  assert.deepEqual(selectTrendReadings(readings, { kind: "pressure", window: "all" }, now).map(({ id }) => id), ["有效血压"]);
  assert.deepEqual(selectTrendReadings(readings, { kind: "glucose", window: "all" }, now).map(({ id }) => id), ["有效血糖"]);
});

test("血糖默认选中最近一次有效记录的测量情况", () => {
  const readings = [
    glucose("最近有效记录", "after-meal"),
    { ...glucose("未测量", "fasting"), measuredAt: at(0, 22) },
    { ...glucose("错误数值", "fasting"), measuredAt: at(0, 8), glucose: 0 },
    { ...glucose("较早记录", "fasting"), measuredAt: at(2) },
    pressure("今天血压", at(0)),
  ];

  assert.equal(latestGlucoseMealContext(readings, now), "after-meal");
  assert.equal(latestGlucoseMealContext([...readings, { ...glucose("旧版最新记录"), measuredAt: at(0) }], now), "unknown");
  assert.equal(latestGlucoseMealContext(readings.slice(1, 3), now), "unknown");
});
