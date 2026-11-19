import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, TrendingUp, MessageCircle, Phone } from "lucide-react";
import { containsHealthIdentifiers, getLocalHealthAnswer, healthTopics } from "@/lib/health-guidance";
import { summarizeHealthTrend } from "@/lib/health-trend-summary";
import "./health-assistant.css";

const api = "/api/health-ai";
const unavailable = "在线 AI 暂时不可用。";
const vettedSources = new Set<string>(Object.values(healthTopics).map((topic) => topic.source));

function useHealthAi() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const check = new AbortController();
    const timeout = window.setTimeout(() => { check.abort(); setEnabled(false); }, 4000);
    fetch(api, { signal: check.signal, cache: "no-store" }).then(async (response) => {
      const status = response.ok ? await response.json() : null;
      if (!check.signal.aborted) setEnabled(status?.enabled === true);
    }).catch(() => { if (!check.signal.aborted) setEnabled(false); }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); check.abort(); request.current?.abort(); };
  }, []);

  async function ask(kind: "question" | "trend", text: string): Promise<{ reply: string; source?: string } | null> {
    if (request.current) return null;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    const timeout = window.setTimeout(() => controller.abort(), 18_000);
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, text }),
        signal: controller.signal,
      });
      const result = response.ok ? await response.json() : null;
      if (typeof result?.reply === "string" && result.reply.trim()) {
        const source = typeof result.source === "string" && vettedSources.has(result.source) ? result.source : undefined;
        return { reply: result.reply, source };
      }
    } catch { /* The caller retains the local result when the request fails. */ }
    finally {
      clearTimeout(timeout);
      request.current = null;
      setBusy(false);
    }
    return null;
  }
  return { enabled, busy, ask };
}

const suggestions = ["药盒上的‘缓释’是什么意思？", "漏服了怎么办？", "复诊要带些什么？"];

export function HealthAssistant() {
  const { enabled, busy, ask } = useHealthAi();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{ question: string; answer: ReturnType<typeof getLocalHealthAnswer>; online: boolean } | null>(null);
  const [notice, setNotice] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const emergencyHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (result?.answer.emergency) emergencyHeading.current?.focus();
  }, [result]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const online = enabled && submitter instanceof HTMLButtonElement && submitter.value === "online";
    const text = question.trim();
    if (!text) { setNotice("请先写下您想问的问题。"); textarea.current?.focus(); return; }
    const local = getLocalHealthAnswer(text);
    const privateText = containsHealthIdentifiers(text);
    setNotice("");
    setResult({ question: privateText ? "您的问题" : text, answer: local, online: false });
    if (local.onlyLocal || !online) return;
    if (privateText) { setNotice("此问题已在本机处理。去掉姓名、手机号等个人信息后，可以再用在线 AI 试试。"); return; }
    const matched = await ask("question", text);
    if (matched) setResult({ question: text, answer: { text: matched.reply, source: matched.source, onlyLocal: false }, online: true });
    else setNotice(`${unavailable}下面是本机答复。`);
  }

  return <>
    <section className="care-summary health-assistant-intro" aria-labelledby="health-assistant-hello">
      <div className="care-summary-heading">
        <span className="care-emblem"><MessageCircle size={25} aria-hidden="true"/></span>
        <h2 id="health-assistant-hello">小慢帮您理一理</h2>
      </div>
      <p>查用药常识，整理复诊时想问的问题。具体用药和身体不适请向医生或药师咨询。</p>
      <p className="care-note">若突发胸痛、呼吸困难或意识不清，请立即求助。<a className="care-text-button" href="tel:120">中国大陆急救 120</a></p>
    </section>
    <form className="care-panel care-form health-assistant-form" onSubmit={submit} aria-describedby="health-question-sharing">
      <h2>您想问什么？</h2>
      <div className="health-prompt-buttons" aria-label="常见问题">
        {suggestions.map((item) => <button className="care-button" key={item} type="button" disabled={busy} onClick={() => {
          setQuestion(item); setNotice(""); textarea.current?.focus();
        }}>{item}</button>)}
      </div>
      <label>您的问题<textarea ref={textarea} rows={3} maxLength={600} required value={question} disabled={busy}
        onChange={(event) => { setQuestion(event.target.value); setNotice(""); }}/></label>
      <p id="health-question-sharing" className="care-note">{enabled
        ? "点「发送给 AI」会把当前问题发给模型服务匹配常见问题。请勿填写姓名、联系方式或病历。"
        : "当前使用本机常见问题。请勿填写姓名、联系方式或病历。"}</p>
      <div className="health-question-actions">
        <button className="care-button care-primary" type="submit" value="local" disabled={busy}>查看常见解答</button>
        {enabled && <button className="care-button" type="submit" value="online" disabled={busy}>
          {busy ? "正在匹配…" : "发送给 AI"}
        </button>}
      </div>
    </form>
    <div className="health-answer-region" aria-live="polite" aria-busy={busy}>
      {notice && <p className="care-status">{notice}</p>}
      {result && <section className="care-panel health-answer" data-urgent={Boolean(result.answer.emergency)} aria-labelledby="health-answer-title">
        <h2 id="health-answer-title" ref={emergencyHeading} tabIndex={result.answer.emergency ? -1 : undefined}>
          {result.answer.emergency ? "请先求助" : result.online ? "AI 匹配的常见解答" : "小慢的答复"}
        </h2>
        <p className="health-answer-question">{result.question}</p>
        <p className="health-answer-text">{result.answer.text}</p>
        {result.answer.emergency && <a className="care-button health-emergency-call" href="tel:120"><Phone size={18} aria-hidden="true"/>拨打 120</a>}
        {result.answer.source && <a className="care-text-button" href={result.answer.source} target="_blank" rel="noreferrer">查看科普来源 <ArrowUpRight size={16} aria-hidden="true"/></a>}
      </section>}
    </div>
  </>;
}

type TrendSummary = NonNullable<ReturnType<typeof summarizeHealthTrend>>;

export function HealthTrendAnalysis({ summary }: { summary: TrendSummary }) {
  const { enabled, busy, ask } = useHealthAi();
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const unknownMeal = summary.kind === "glucose" && summary.mealContext === "unknown";
  const canCompare = summary.count >= 2 && !unknownMeal;

  async function analyze() {
    setNotice(""); setReply("");
    const result = await ask("trend", JSON.stringify(summary));
    if (result) setReply(result.reply);
    else setNotice(`${unavailable}仍可以查看上方的记录范围。`);
  }

  return <section className="care-panel health-trend-analysis" aria-labelledby="health-analysis-title">
    <div className="care-summary-heading">
      <span className="care-emblem"><TrendingUp size={23} aria-hidden="true"/></span>
      <h2 id="health-analysis-title">本段测量摘要</h2>
    </div>
    <dl className="health-range-list">{summary.series.map(({ label, unit, minimum, maximum, first, last }) => <div key={label}>
      <dt>{label}</dt>
      <dd><strong>{minimum === maximum ? minimum : `${minimum}–${maximum}`}</strong> <span>{unit}</span></dd>
      {canCompare && <dd className="care-note">首次 {first} · 末次 {last}</dd>}
    </div>)}</dl>
    <p className="care-note">{unknownMeal ? "这些记录没有注明空腹或餐后，仅显示记录范围。"
      : summary.count < 2 ? "有至少两条相同类型的记录后，可以比较这段时间的变化。"
        : "这里显示当前筛选范围内的测量值。可带给医生一起看。"}</p>
    {canCompare && (enabled ? <>
      <p className="care-note" id="health-analysis-sharing">点击后会把测量类型、筛选时段、条数、最低值、最高值和首末两次读数发给模型。测量日期和备注留在本机。</p>
      <button type="button" className="care-button care-primary" aria-describedby="health-analysis-sharing"
        disabled={busy} onClick={analyze}>{busy ? "正在整理…" : "AI 帮我整理"}</button>
    </> : enabled === false && <p className="care-note">在线 AI 未启用，以上摘要由本机计算。</p>)}
    <div className="health-answer-region" aria-live="polite" aria-busy={busy}>
      {notice && <p className="care-status">{notice}</p>}
      {reply && <div className="health-trend-reply"><h3>AI 整理的复诊提示</h3><p className="health-answer-text">{reply}</p></div>}
    </div>
  </section>;
}
