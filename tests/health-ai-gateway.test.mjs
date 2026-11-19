import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { createHealthAiMiddleware } from "../server/health-ai.ts";

const env = { HEALTH_AI_API_KEY: "fake-test-key" };
const question = { kind: "question", text: "药盒上的用法一栏通常写什么？" };
const trend = {
  kind: "glucose",
  count: 2,
  window: 7,
  mealContext: "fasting",
  series: [{ label: "血糖", unit: "mmol/L", minimum: 5.5, maximum: 6, first: 5.5, last: 6 }],
};

function gateway(options = {}) {
  const middleware = createHealthAiMiddleware(options);
  const origin = "http://127.0.0.1:5173";
  const request = (method, payload, headers = {}, remoteAddress = "127.0.0.1") => new Promise((resolve, reject) => {
    const req = Readable.from(payload === undefined ? [] : [Buffer.from(JSON.stringify(payload))]);
    Object.assign(req, {
      url: "/api/health-ai",
      method,
      headers: { host: "127.0.0.1:5173", ...headers },
      socket: { remoteAddress },
    });
    const res = {
      writeHead(status, headers) {
        this.options = { status, headers };
      },
      end(body) {
        resolve(new Response(body, this.options));
      },
    };
    middleware(req, res, () => reject(new Error("Health route fell through")));
  });
  return {
    get: () => request("GET"),
    post: (payload, headers, remoteAddress) => request(
      "POST", payload, { "content-type": "application/json", origin, ...headers }, remoteAddress,
    ),
  };
}

function completion(content) {
  return Response.json({
    id: "completion-test",
    object: "chat.completion",
    choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content } }],
  });
}

test("no key and unsafe upstream configuration disable the gateway", async () => {
  for (const config of [{}, { ...env, HEALTH_AI_BASE_URL: "http://example.test/v1" }]) {
    const api = gateway({ env: config });
    assert.deepEqual(await (await api.get()).json(), { enabled: false });
    const response = await api.post(question);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "not_configured" });
  }
});

test("online education returns the selected vetted topic and keeps provider credentials server-side", async () => {
  let upstream;
  const api = gateway({
    env,
    fetcher: async (url, options) => {
      upstream = { url: String(url), options };
      return completion("label");
    },
  });
  const status = await api.get();
  assert.deepEqual(await status.json(), { enabled: true });
  assert.equal(status.headers.get("cache-control"), "no-store");

  const response = await api.post(question);
  assert.equal(response.status, 200);
  const { reply } = await response.json();
  assert.match(reply, /药盒|说明书|药品标签/);
  assert.doesNotMatch(reply, /fake-test-key/);
  assert.equal(upstream.url, "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
  assert.equal(upstream.options.redirect, "error");
  assert.equal(new Headers(upstream.options.headers).get("authorization"), "Bearer fake-test-key");
  const input = JSON.parse(upstream.options.body);
  assert.equal(input.model, "qwen-plus");
  assert.equal(input.messages.at(-1).content, question.text);
});

test("out-of-origin, proxied, and non-JSON requests cannot call the upstream", async () => {
  let upstreamCalls = 0;
  const api = gateway({ env, fetcher: async () => { upstreamCalls++; return completion("label"); } });
  assert.equal((await api.post(question, { origin: "https://elsewhere.test" })).status, 403);
  assert.equal((await api.post(question, { origin: "null" })).status, 403);
  assert.equal((await api.post(question, { origin: undefined })).status, 403);
  assert.equal((await api.post(question, { "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal((await api.post(question, { forwarded: "for=127.0.0.1" })).status, 403);
  assert.equal((await api.post(question, { host: "elsewhere.test", origin: "http://elsewhere.test" })).status, 403);
  assert.equal((await api.post(question, {}, "192.0.2.5")).status, 403);
  assert.equal((await api.post(question, { "content-type": "text/plain" })).status, 415);
  assert.equal((await api.post({ ...question, text: "字".repeat(7_000) })).status, 413);
  assert.equal(upstreamCalls, 0);
});

test("urgent and identifying questions stay local", async () => {
  let upstreamCalls = 0;
  const api = gateway({ env, fetcher: async () => { upstreamCalls++; return completion("label"); } });
  const urgent = await api.post({ ...question, text: "我现在胸痛，呼吸困难怎么办？" });
  assert.equal(urgent.status, 200);
  assert.match((await urgent.json()).reply, /120|急救/);
  const personal = await api.post({ ...question, text: "我的邮箱是 someone@example.com，药盒怎么看？" });
  assert.equal(personal.status, 200);
  assert.match((await personal.json()).reply, /个人信息|邮箱/);
  assert.equal(upstreamCalls, 0);
});

test("trends use validated aggregate numbers and vetted discussion questions", async () => {
  let upstreamInput;
  const api = gateway({
    env,
    fetcher: async (_url, options) => {
      upstreamInput = JSON.parse(options.body).messages.at(-1).content;
      return completion('["conditions","summary"]');
    },
  });
  const response = await api.post({ kind: "trend", text: JSON.stringify(trend) });
  assert.equal(response.status, 200);
  const { reply } = await response.json();
  assert.match(reply, /5\.5.+6/);
  assert.match(reply, /用餐间隔/);
  assert.match(reply, /下次就诊/);
  assert.deepEqual(JSON.parse(upstreamInput), trend);
});

test("private fields and incomparable glucose records are rejected before upstream", async () => {
  let upstreamCalls = 0;
  const api = gateway({ env, fetcher: async () => { upstreamCalls++; return completion("label"); } });
  for (const payload of [{ ...trend, notes: "personal data" }, { ...trend, mealContext: "unknown" }]) {
    const response = await api.post({ kind: "trend", text: JSON.stringify(payload) });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_request" });
  }
  assert.equal(upstreamCalls, 0);
});

test("unexpected model text and upstream failures produce generic responses", async () => {
  for (const fetcher of [
    async () => completion("unvetted treatment text fake-test-key"),
    async () => new Response("internal upstream details", { status: 401 }),
    async () => { throw new Error("internal network details"); },
  ]) {
    const api = gateway({ env, fetcher });
    const response = await api.post(question);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "upstream_unavailable" });
  }
});

test("concurrent calls are bounded and completed calls free a slot", async () => {
  let notify;
  const bothStarted = new Promise((resolve) => { notify = resolve; });
  const releases = [];
  const api = gateway({ env, fetcher: () => {
    if (releases.length === 2) return Promise.resolve(completion("label"));
    return new Promise((resolve) => {
      releases.push(() => resolve(completion("label")));
      if (releases.length === 2) notify();
    });
  } });
  const first = api.post(question);
  const second = api.post(question);
  await bothStarted;
  const busy = await api.post(question);
  releases.forEach((release) => release());
  assert.equal(busy.status, 429);
  assert.equal((await first).status, 200);
  assert.equal((await second).status, 200);
  assert.equal((await api.post(question)).status, 200);
});
