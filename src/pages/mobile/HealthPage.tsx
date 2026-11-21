import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Activity, ChevronRight, ClipboardList, Clock3, HeartPulse, MessageCircle, Plus } from "lucide-react";
import CarePage, { type CareTextProps } from "@/components/mobile/CarePage";
import { HealthAssistant, HealthTrendAnalysis } from "@/components/mobile/HealthAssistant";
import { HealthReadingForm } from "@/components/mobile/HealthReadingForm";
import { HealthTrendChart } from "@/components/mobile/HealthTrendChart";
import { HealthVisit } from "@/components/mobile/HealthVisit";
import { MedicationReminder } from "@/components/mobile/MedicationReminder";
import {
  emptyHealthBook, localDay, medicationStatus, readHealthBook, readingLabel, readingValueLabel,
  ReadingChangedError, recordTaken, removeReading, saveMedicationPlan, undoTaken, updateHealthBook,
  type HealthBook, type Medication, type Reading, type SaveBook,
} from "@/lib/health";
import { summarizeHealthTrend } from "@/lib/health-trend-summary";
import { selectRecentReadings, type TrendSelection } from "@/lib/health-trends";
import { VisitNotesChangedError } from "@/lib/health-visit";

export type HealthView = "overview" | "medication" | "readings" | "visit" | "assistant";
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
    setStatus("");
    try {
      setState({ book: await updateHealthBook(update), error: "" });
      setStatus(message);
      return true;
    } catch (error) {
      if (error instanceof ReadingChangedError) {
        setStatus("这条记录已经在另一个页面更新或删除。请先核对最新的测量记录。");
      } else if (error instanceof VisitNotesChangedError) {
        setStatus("另一个页面已经修改了这条笔记。本页草稿还在，可以先复制，再查看已保存的笔记。");
      } else {
        setStatus("保存未成功，原有记录仍可保留。请检查浏览器存储后重试。");
      }
      return false;
    } finally {
      pending.current = false;
    }
  };
  return { book, error, status, save, clearStatus: () => setStatus("") };
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
  const pendingPlans = book.plans.filter((plan) => !medicationStatus(book.intakes, plan.id, day))
    .sort((first, second) => first.time.localeCompare(second.time));
  const done = book.plans.length - pendingPlans.length;
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
      {pendingPlans.length > 0 && <Link className="health-today-pending" to="/health/medication">
        <Clock3 size={21} aria-hidden="true"/>
        <span><strong>核对今日用药记录</strong><small>{pendingPlans[0].time} · {pendingPlans[0].name}{pendingPlans.length > 1 ? " 等 " + pendingPlans.length + " 项未记录" : " · 未记录"}</small></span>
        <ChevronRight size={18} aria-hidden="true"/>
      </Link>}
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
    <MedicationReminder plans={plans}/>
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
    <p className="care-note">未记录时，先核对实际服用情况。有补服或用量疑问请联系医生或药师。</p>
    <Link className="care-button" to="/health/assistant"><MessageCircle size={19} aria-hidden="true"/>查用药常识</Link>
  </>;
}

function HealthReadings({ book, save, status, clearStatus }: {
  book: HealthBook; save: SaveBook; status: string; clearStatus: () => void;
}) {
  const [editing, setEditing] = useState<Reading | null>(null);
  const [statusArea, setStatusArea] = useState<"form" | "list">("form");
  const [trendSelection, setTrendSelection] = useState<TrendSelection>(() => {
    const latest = selectRecentReadings(book.readings, "all").at(-1);
    return latest?.kind === "glucose"
      ? { kind: "glucose", window: "all", mealContext: latest.mealContext ?? "unknown" }
      : { kind: "pressure", window: "all" };
  });
  const listHeading = useRef<HTMLHeadingElement>(null);
  // Keep saved measurements visible for correction even when the device clock changes.
  const sorted = [...book.readings].sort((first, second) =>
    (Date.parse(second.measuredAt) || 0) - (Date.parse(first.measuredAt) || 0));
  const summary = summarizeHealthTrend(book.readings, trendSelection);

  function showReading(reading: Reading) {
    setTrendSelection((selection) => ({
      ...selection, kind: reading.kind,
      mealContext: reading.kind === "glucose" ? reading.mealContext ?? "unknown" : selection.mealContext,
    }));
  }

  function endEdit() {
    if (!editing) return;
    const editButtonId = "health-edit-" + editing.id;
    setEditing(null);
    setStatusArea("list");
    requestAnimationFrame(() => (document.getElementById(editButtonId) ?? listHeading.current)?.focus());
  }

  async function confirmRemove(reading: Reading) {
    if (!window.confirm("删除这条测量记录？")) return;
    setStatusArea("list");
    await save((current) => removeReading(current, reading), "已删除测量记录。");
    listHeading.current?.focus();
  }

  return <>
    <p className="care-status health-record-status" role="status">{statusArea === "form" ? status : ""}</p>
    <div hidden={editing !== null}>
      <HealthReadingForm save={(update, message) => { setStatusArea("form"); return save(update, message); }} onSaved={showReading}/>
    </div>
    {editing && <HealthReadingForm key={editing.id} original={editing} save={save} onCancel={endEdit}
      onSaved={(reading) => { showReading(reading); endEdit(); }}/>}
    <HealthTrendChart readings={book.readings} selection={trendSelection} onSelectionChange={setTrendSelection}/>
    {summary && <HealthTrendAnalysis key={JSON.stringify(summary)} summary={summary}/>}
    <section className="care-panel" aria-labelledby="readings-heading">
      <h2 id="readings-heading" ref={listHeading} tabIndex={-1}>我的测量记录</h2>
      <p className="care-status health-record-status" role="status">{statusArea === "list" ? status : ""}</p>
      {sorted.length === 0 ? <p className="care-empty">还没有血压或血糖记录。</p> :
        <ul className="care-records">{sorted.map((reading) => {
          const date = new Date(reading.measuredAt);
          const hasDate = Number.isFinite(date.getTime());
          const timestamp = hasDate ? dateTimeLabel.format(date) : "时间待核对";
          return <li className="care-record" key={reading.id}>
            <div className="care-record-heading">
              <strong>{readingLabel(reading)}</strong>
              <time dateTime={hasDate ? reading.measuredAt : undefined}>{timestamp}</time>
            </div>
            <p className="care-reading-value">{readingValueLabel(reading)}</p>
            {reading.note && <p className="care-note">{reading.note}</p>}
            <div className="care-actions">
              <button className="care-button" type="button" id={"health-edit-" + reading.id}
                aria-label={"修改记录 · " + readingLabel(reading) + " · " + timestamp}
                disabled={editing !== null} onClick={() => {
                  clearStatus(); setStatusArea("form"); setEditing(reading);
                }}>修改记录</button>
              <button className="care-text-button" type="button" disabled={editing !== null}
                aria-label={"删除记录 · " + readingLabel(reading) + " · " + timestamp}
                onClick={() => confirmRemove(reading)}>删除记录</button>
            </div>
          </li>;
        })}</ul>}
    </section>
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
  const { book, error, status, save, clearStatus } = useHealthBook();
  const today = useToday();
  const [title, description] = headings[view];
  return <CarePage {...textProps} title={title} description={description} tone="teal" backTo={view === "overview" ? "/" : "/health"}>
    {error && <p className="care-error" role="alert">{error}</p>}
    {view === "medication" && <p className="care-status" role="status">{status}</p>}
    {view === "overview" && <Overview book={book} today={today}/>}
    {view === "medication" && <MedicationPlans book={book} today={today} save={save}/>}
    {view === "readings" && <HealthReadings book={book} save={save} status={status} clearStatus={clearStatus}/>}
    {view === "assistant" && <HealthAssistant/>}
    {view === "visit" && <HealthVisit book={book} today={today} save={save} saveStatus={status} clearStatus={clearStatus}/>}
  </CarePage>;
}
