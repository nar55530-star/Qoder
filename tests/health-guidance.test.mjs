import assert from "node:assert/strict";
import test from "node:test";
import { containsHealthIdentifiers, getLocalHealthAnswer } from "../src/lib/health-guidance.ts";

test("emergency signals take priority over medication questions", () => {
  for (const question of ["药吃多了，现在胸痛、喘不上气", "我现在胸闷，胸口压着很难受", "我爷爷突然嘴歪了，说话含糊", "我不小心吃了双倍药量"]) {
    const answer = getLocalHealthAnswer(question);
    assert.equal(answer.emergency, true, question);
    assert.equal(answer.onlyLocal, true, question);
    assert.match(answer.text, /120/);
  }
});

test("personal medication decisions or measured values do not reach the model", () => {
  for (const question of ["昨天漏服，今天能补两片吗？", "这两种药能一起吃吗", "现在血压 150/98，要吃药吗？", "血糖8.2正常吗", "我一天吃几次？", "该吃什么药？", "我可以把药掰开吗？"]) {
    assert.equal(getLocalHealthAnswer(question).onlyLocal, true, question);
  }
  assert.equal(getLocalHealthAnswer("缓释是什么意思？").onlyLocal, false);
  assert.match(getLocalHealthAnswer("去医院要带什么？").text, /用药/);
});

test("obvious direct identifiers are blocked without mistaking measurement units for identifiers", () => {
  assert.equal(containsHealthIdentifiers("手机 138 0013 8000"), true);
  assert.equal(containsHealthIdentifiers("身份证号为 110101199001010011"), true);
  assert.equal(containsHealthIdentifiers("邮箱 example@example.com"), true);
  assert.equal(containsHealthIdentifiers("什么是 mmHg？"), false);
});
