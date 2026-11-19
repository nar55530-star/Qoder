import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, ChevronRight, ClipboardList, Clock3, HeartPulse, MessageCircle, Plus } from "lucide-react";
import CarePage, { type CareTextProps } from "@/components/mobile/CarePage";
import { HealthAssistant, HealthTrendAnalysis } from "@/components/mobile/HealthAssistant";
import { HealthTrendChart } from "@/components/mobile/HealthTrendChart";
import {
  emptyHealthBook, localDay, mealContextLabel, medicationStatus, readHealthBook, readingValues,
  recordTaken, saveMedicationPlan, undoTaken, updateHealthBook,
  type HealthBook, type MealContext, type Medication, type Reading, type ReadingValues,
} from "@/lib/health";
import { summarizeHealthTrend } from "@/lib/health-trend-summary";
import type { TrendSelection } from "@/lib/health-trends";

export type HealthView = "overview" | "medication" | "readings" | "visit" | "assistant";
type SaveBook = (update: (book: HealthBook) => HealthBook, message: string) => Promise<boolean>;
const calendarLabel = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" });
const dateTimeLabel = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const id = () => crypto.getRandomValues(new Uint32Array(4)).join("-");

function loadBook() {
  try { return { book: readHealthBook(), error: "" }; }
  catch { return { book: emptyHealthBook, error: "暂时无法读取健康记录，请检查浏览器的存储设置。" }; }
}

function useHealthBook() {
  const [{ book, error }, setState] = useState(loadBook);
  const [status, setStatus] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    const refresh = () => setState(loadBook());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  const save: SaveBook = async (update, message) => {
    if (pending.current) return false;
    pending.current = true;
    try {
      setState({ book: await updateHealthBook(update), error: "" });
      setStatus(message);
      return true;
    } catch {
      setStatus("保存未成功，原有记录仍可保留。请检查浏览器存储后重试。");
      return false;
    } finally {
      pending.current = false;
    }
  };
  return { book, error, status, save };
}

function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setToday((date) => {
      const now = new Date();
      return localDay(date) === localDay(now) ? date : now;
    });
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}

const healthLinks = [
  { to: "/health/medication", title: "用药计划", description: "看时间、确认今天是否记录服用", Icon: Clock3 },
  { to: "/health/readings", title: "身体情况", description: "记录血压、血糖，查看历史曲线", Icon: Activity },
  { to: "/health/assistant", title: "小慢健康问答", description: "查用药常识，准备想问医生的问题", Icon: MessageCircle },
  { to: "/health/visit", title: "就诊准备", description: "整理想问医生的问题和要带的记录", Icon: ClipboardList },
] as const;

function Overview({ book, today }: { book: HealthBook; today: Date }) {
  const day = localDay(today);
  const done = book.plans.filter((plan) => medicationStatus(book.intakes, plan.id, day)).length;
  const readings = book.readings.filter((reading) => localDay(new Date(reading.measuredAt)) === day).length;
  return <>
    <section className="care-summary" aria-labelledby="today-health">
      <div className="care-summary-heading">
        <span className="care-emblem"><HeartPulse size={27} aria-hidden="true"/></span>
        <div><p>{calendarLabel.format(today)}</p><h2 id="today-health">今日健康</h2></div>
      </div>
      <div className="care-stats">
        <div><strong>{done}<small> / {book.plans.length}</small></strong><span>已记录用药</span></div>
        <div><strong>{readings}<small> 条</small></strong><span>身体情况记录</span></div>
      </div>
    </section>
    <nav className="care-menu" aria-label="健康管理功能">
      {healthLinks.map(({ to, title, description, Icon }) =>
        <Link className="care-menu-link" key={to} to={to}>
          <span className="care-emblem"><Icon size={23} aria-hidden="true"/></span>
          <span><strong>{title}</strong><small>{description}</small></span>
          <ChevronRight size={20} aria-hidden="true"/>
        </Link>,
      )}
    </nav>
    <p className="care-note">健康记录保存在当前设备的浏览器中。</p>
  </>;
}

const blankPlan = { name: "", time: "", instructions: "" };

function MedicationPlans({ book, today, save }: { book: HealthBook; today: Date; save: SaveBook }) {
  const [draft, setDraft] = useState(blankPlan);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const day = localDay(today);
  const plans = [...book.plans].sort((first, second) => first.time.localeCompare(second.time));
  const editingRecordedPlan = editing !== null && medicationStatus(book.intakes, editing, day);

  function openForm(plan?: Medication) {
    setEditing(plan?.id ?? null);
    setDraft(plan ? { name: plan.name, time: plan.time, instructions: plan.instructions } : blankPlan);
    setFormOpen(true);
    requestAnimationFrame(() => form.current?.querySelector("input")?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      const input = form.current?.querySelector("input");
      input?.setCustomValidity("请填写药品名称。");
      input?.reportValidity();
      return;
    }
    const plan = { id: id(), name: draft.name.trim(), time: draft.time, instructions: draft.instructions.trim() };
    const saved = await save((current) => saveMedicationPlan(current, plan, editing, new Date()),
      editing ? "已修改用药计划。" : "已添加用药计划。");
    if (saved) setFormOpen(false);
  }

  function toggleDone(planId: string, alreadyRecorded: boolean) {
    if (alreadyRecorded && !window.confirm("撤销这条服用记录？")) return;
    const now = new Date();
    const recordedDay = localDay(now);
    if (recordedDay !== day) return;
    save((current) => {
      const plan = current.plans.find((item) => item.id === planId);
      if (!plan) throw new Error("Missing plan");
      const intakes = alreadyRecorded ? undoTaken(current.intakes, plan.id, recordedDay) : recordTaken(current.intakes, plan, now);
      return { ...current, intakes };
    }, alreadyRecorded ? "已撤销这次服用记录。" : "已记录本次服用。");
  }

  return <>
    <section className="care-panel" aria-labelledby="plan-heading">
      <h2 id="plan-heading">今天的用药计划</h2>
      <p className="care-note">按医嘱填写。每天有多个服用时间时，可以分开添加。</p>
      {plans.length === 0 && <p className="care-empty">今天还没有用药计划。</p>}
      <ul className="care-records">
        {plans.map((plan) => {
          const taken = medicationStatus(book.intakes, plan.id, day);
          return <li className="care-record" key={plan.id}>
            <div className="care-record-heading">
              <time dateTime={plan.time}>{plan.time}</time>
              <span className="care-state" data-done={Boolean(taken)}>{taken ? "已记录服用" : "未记录"}</span>
            </div>
            <strong>{plan.name}</strong>
            {plan.instructions && <p className="care-note">{plan.instructions}</p>}
            {taken && <p className="care-note">记录于 {dateTimeLabel.format(new Date(taken.recordedAt))}</p>}
            <div className="care-actions">
              <button type="button" className={taken ? "care-button" : "care-button care-primary"}
                onClick={() => toggleDone(plan.id, Boolean(taken))}>{taken ? "撤销记录" : "记录已服用"}</button>
              <button type="button" className="care-text-button" onClick={() => openForm(plan)}>编辑</button>
              <button type="button" className="care-text-button" aria-label={`删除${plan.name}的计划`} onClick={async () => {
                if (!window.confirm(`删除「${plan.name}」的计划？过往的服用记录会保留。`)) return;
                const saved = await save((current) => ({ ...current, plans: current.plans.filter((item) => item.id !== plan.id) }), "已删除用药计划。");
                if (saved && editing === plan.id) setFormOpen(false);
              }}>删除</button>
            </div>
          </li>;
        })}
      </ul>
      {!formOpen && <button className="care-button care-primary" type="button" onClick={() => openForm()}><Plus size={20} aria-hidden="true"/>添加用药计划</button>}
    </section>
    {formOpen && <form className="care-panel care-form" ref={form} onSubmit={submit}>
      <h2>{editing ? "修改用药计划" : "添加用药计划"}</h2>
      {editingRecordedPlan && <p className="care-note">原计划今天已记录服用。更改后，请先核对已保存的服用记录。</p>}
      <label>药品名称<input required maxLength={60} value={draft.name} onChange={(event) => {
        event.target.setCustomValidity("");
        setDraft({ ...draft, name: event.target.value });
      }}/></label>
      <label>每天的计划时间<input type="time" value={draft.time} required onChange={(event) => setDraft({ ...draft, time: event.target.value })}/></label>
      <label>医嘱或用法备注（选填）<textarea rows={2} maxLength={160} value={draft.instructions} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })}/></label>
      <div className="care-actions">
        <button className="care-button care-primary" type="submit">保存计划</button>
        <button className="care-button" type="button" onClick={() => setFormOpen(false)}>取消</button>
      </div>
    </form>}
    <details className="care-panel care-details">
      <summary>服用记录</summary>
      {book.intakes.length === 0 ? <p className="care-note">还没有服用记录。</p> :
        <ul className="care-records">{book.intakes.map((intake) =>
          <li className="care-record" key={`${intake.planId}-${intake.day}`}>
            <strong>{intake.name}</strong>
            <p className="care-note">{intake.day} · 计划 {intake.scheduledTime} · 记录于 {dateTimeLabel.format(new Date(intake.recordedAt))}</p>
            {intake.day === day && !book.plans.some((plan) => plan.id === intake.planId) &&
              <button type="button" className="care-text-button" onClick={() => {
                if (window.confirm("撤销这条服用记录？")) {
                  save((current) => ({ ...current, intakes: undoTaken(current.intakes, intake.planId, intake.day) }), "已撤销这次服用记录。");
                }
              }}>撤销这条记录</button>}
          </li>,
        )}</ul>}
    </details>
    <p className="care-note">到点响铃请用手机系统闹钟。未记录时，先核对实际服用情况。有补服或用量疑问请联系医生或药师。</p>
    <Link className="care-button" to="/health/assistant"><MessageCircle size={19} aria-hidden="true"/>查用药常识</Link>
  </>;
}

function localDateTimeInput(date: Date) {
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${localDay(date)}T${time}`;
}

function HealthReadings({ book, save }: { book: HealthBook; save: SaveBook }) {
  const [kind, setKind] = useState<ReadingValues["kind"]>("pressure");
  const [mealContext, setMealContext] = useState<MealContext>("unknown");
  const [trendSelection, setTrendSelection] = useState<TrendSelection>({ kind: "pressure", window: "all" });
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [measuredAt, setMeasuredAt] = useState(() => localDateTimeInput(new Date()));
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const sorted = [...book.readings].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
  const summary = summarizeHealthTrend(book.readings, trendSelection);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = readingValues(kind, first, second);
    if (!values) {
      setFormError(kind === "pressure" ? "请核对血压。高压、低压填写正整数，高压应大于低压。" : "请按血糖仪显示填写大于 0 的数值。");
      return;
    }
    const date = new Date(measuredAt);
    if (!Number.isFinite(date.getTime()) || date > new Date()) {
      setFormError("请填写已经测量的日期和时间。");
      return;
    }
    const details = { id: id(), measuredAt: date.toISOString(), note: note.trim() };
    const reading: Reading = values.kind === "glucose" ? { ...values, ...details, mealContext } : { ...values, ...details };
    setFormError("");
    if (await save((current) => ({ ...current, readings: [reading, ...current.readings] }), "身体情况已保存。")) {
      setFirst(""); setSecond(""); setNote(""); setMealContext("unknown"); setMeasuredAt(localDateTimeInput(new Date()));
      setTrendSelection((selection) => ({ ...selection, kind: reading.kind, mealContext: reading.kind === "glucose" ? mealContext : selection.mealContext }));
    }
  }
  return <>
    <form className="care-panel care-form" onSubmit={submit}>
      <h2>新增测量记录</h2>
      <label>记录类型
        <select value={kind} onChange={(event) => {
          setKind(event.target.value === "glucose" ? "glucose" : "pressure");
          setFirst(""); setSecond(""); setFormError("");
        }}><option value="pressure">血压</option><option value="glucose">血糖</option></select>
      </label>
      <div className={kind === "pressure" ? "care-input-pair" : undefined}>
        <label>{kind === "pressure" ? "高压（mmHg）" : "血糖（mmol/L）"}
          <input type="number" min={kind === "pressure" ? "1" : "0.01"} step={kind === "pressure" ? "1" : "any"}
            inputMode={kind === "pressure" ? "numeric" : "decimal"} required value={first} onChange={(event) => setFirst(event.target.value)}/>
        </label>
        {kind === "pressure" && <label>低压（mmHg）
          <input type="number" min="1" step="1" inputMode="numeric" required value={second} onChange={(event) => setSecond(event.target.value)}/>
        </label>}
      </div>
      {kind === "glucose" && <label>血糖测量时机
        <select value={mealContext} onChange={(event) => setMealContext(event.target.value as MealContext)}>
          {(Object.keys(mealContextLabel) as MealContext[]).map((value) => <option key={value} value={value}>{mealContextLabel[value]}</option>)}
        </select>
      </label>}
      <label>测量时间<input type="datetime-local" required value={measuredAt} onChange={(event) => setMeasuredAt(event.target.value)}/></label>
      <label>当时的情况（选填）<input value={note} maxLength={100} onChange={(event) => setNote(event.target.value)}/></label>
      {formError && <p className="care-error" role="alert">{formError}</p>}
      <button className="care-button care-primary" type="submit">保存测量记录</button>
    </form>
    <HealthTrendChart readings={book.readings} selection={trendSelection} onSelectionChange={setTrendSelection}/>
    {summary && <HealthTrendAnalysis key={JSON.stringify(summary)} summary={summary}/>}
    <section className="care-panel" aria-labelledby="readings-heading">
      <h2 id="readings-heading">我的测量记录</h2>
      {sorted.length === 0 ? <p className="care-empty">还没有血压或血糖记录。</p> :
        <ul className="care-records">{sorted.map((reading) => (
          <li className="care-record" key={reading.id}>
            <div className="care-record-heading">
              <strong>{reading.kind === "pressure" ? "血压" : `血糖 · ${mealContextLabel[reading.mealContext ?? "unknown"]}`}</strong>
              <time dateTime={reading.measuredAt}>{dateTimeLabel.format(new Date(reading.measuredAt))}</time>
            </div>
            <p className="care-reading-value">{reading.kind === "pressure" ? `${reading.systolic} / ${reading.diastolic} mmHg` : `${reading.glucose} mmol/L`}</p>
            {reading.note && <p className="care-note">{reading.note}</p>}
            <button className="care-text-button" type="button" onClick={() => {
              if (window.confirm("删除这条测量记录？")) save((current) => ({ ...current, readings: current.readings.filter((item) => item.id !== reading.id) }), "已删除测量记录。");
            }}>删除记录</button>
          </li>
        ))}</ul>}
    </section>
  </>;
}

function PrepareVisit() {
  return <>
    <section className="care-panel" aria-labelledby="visit-heading">
      <h2 id="visit-heading">去医院前准备三件事</h2>
      <ol className="care-steps">
        <li><strong>记下哪里不舒服</strong><span>从什么时候开始，后来有没有变化，有哪些事需要问医生。</span></li>
        <li><strong>带上用药清单</strong><span>整理正在用的药品、用法，以及已知的药物过敏情况。必要时把药盒也带上。</span></li>
        <li><strong>带上近期测量记录</strong><span>血压、血糖和测量时间可以一起给医生看。</span></li>
      </ol>
      <div className="care-actions">
        <Link className="care-button" to="/health/medication">看用药计划</Link>
        <Link className="care-button" to="/health/readings">看测量记录</Link>
      </div>
    </section>
    <p className="care-note">用药和检查结果以医生判断为准。</p>
    <a className="care-text-button" href="https://wjw.sz.gov.cn/gzdt/content/post_12887989.html"
      target="_blank" rel="noreferrer">查看卫健部门用药指引 <ArrowUpRight size={16} aria-hidden="true"/></a>
  </>;
}

const headings = {
  overview: ["健康管理", "把用药时间和身体情况记下来，需要时方便查看。"],
  medication: ["用药计划", "按医嘱记好时间，实际服用后再记录。"],
  readings: ["身体情况", "照着测量仪记下数字，就诊时可以给医生看。"],
  assistant: ["小慢健康问答", "您可以查用药常识，也可以先把想问医生的话理一理。"],
  visit: ["就诊准备", "出门前，把想问的问题和要带的记录准备好。"],
} as const;

export default function HealthPage({ view = "overview", ...textProps }: CareTextProps & { view?: HealthView }) {
  const { book, error, status, save } = useHealthBook();
  const today = useToday();
  const [title, description] = headings[view];
  return <CarePage {...textProps} title={title} description={description} tone="teal" backTo={view === "overview" ? "/" : "/health"}>
    {error && <p className="care-error" role="alert">{error}</p>}
    <p className="care-status" role="status">{status}</p>
    {view === "overview" && <Overview book={book} today={today}/>}
    {view === "medication" && <MedicationPlans book={book} today={today} save={save}/>}
    {view === "readings" && <HealthReadings book={book} save={save}/>}
    {view === "assistant" && <HealthAssistant/>}
    {view === "visit" && <PrepareVisit/>}
  </CarePage>;
}
