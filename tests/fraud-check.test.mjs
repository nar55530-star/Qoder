import assert from "node:assert/strict";
import test from "node:test";
import { checkFraudMessage } from "../src/lib/fraud-check.ts";

test("一次找出远程控制、验证码和假客服的独立线索", () => {
  const text = "客服称要取消自动扣费，请开启屏幕　共享，把验证码发给我。";
  assert.deepEqual(checkFraudMessage(text), ["screen", "code", "refund"]);
});

test("识别陌生链接和要求先付款", () => {
  assert.deepEqual(checkFraudMessage("请先转账，再点链接领取。ｈｔｔｐｓ：／／example.invalid"), ["payment", "link"]);
});

test("识别冒充亲友借钱和承诺保本高收益", () => {
  assert.deepEqual(checkFraudMessage("家人发消息说急用钱，请借钱给他。"), ["family"]);
  assert.deepEqual(checkFraudMessage("有人推销养老项目，说稳赚不赔。"), ["investment"]);
});

test("页面内置的常见可疑做法也能通过文字识别", () => {
  assert.deepEqual(checkFraudMessage("要先交一笔钱，才能领取红包或领奖"), ["payment"]);
  assert.deepEqual(checkFraudMessage("短信附了一个缴费链接，说现在不付就会停服务"), ["link"]);
  assert.deepEqual(checkFraudMessage("开通了付费服务，要加他好友才能取消"), ["refund"]);
});

test("普通通知和不透露验证码的提示不会判成风险线索", () => {
  assert.deepEqual(checkFraudMessage("退款已经到账。请勿将验证码告诉他人。"), []);
  assert.deepEqual(checkFraudMessage("   "), []);
});
