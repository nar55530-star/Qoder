import { useEffect, useRef, useState, type FormEvent } from "react";
import { localDay, mealContextLabel, readingValues, saveReading, type MealContext, type Reading, type SaveBook } from "@/lib/health";

const timeLabel = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const mealContexts: MealContext[] = ["unknown", "fasting", "after-meal"];

function localDateTimeInput(date: Date) {
  return Number.isFinite(date.getTime()) ? localDay(date) + "T" + timeLabel.format(date) : "";
}

export function HealthReadingForm({ original, initialKind, save, onSaved, onCancel }: {
  original?: Reading;
  initialKind?: Reading["kind"];
  save: SaveBook;
  onSaved: (reading: Reading) => void;
  onCancel?: () => void;
}) {
  const [kind, setKind] = useState<Reading["kind"]>(original?.kind ?? initialKind ?? "pressure");
  const [mealContext, setMealContext] = useState<MealContext>(original?.kind === "glucose" ? original.mealContext ?? "unknown" : "unknown");
  const [first, setFirst] = useState(original ? String(original.kind === "pressure" ? original.systolic : original.glucose) : "");
  const [second, setSecond] = useState(original?.kind === "pressure" ? String(original.diastolic) : "");
  const [customTime, setCustomTime] = useState(Boolean(original));
  const [measuredAt, setMeasuredAt] = useState(() => original ? localDateTimeInput(new Date(original.measuredAt)) : "");
  const [note, setNote] = useState(original?.note ?? "");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (original || initialKind) formHeading.current?.focus(); }, [original, initialKind]);

  function adjustTime() {
    setCustomTime(true);
    setMeasuredAt(localDateTimeInput(new Date()));
    requestAnimationFrame(() => dateInput.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const values = readingValues(kind, first, second);
    if (!values) {
      setFormError(kind === "pressure" ? "请核对血压。高压、低压填写正整数，高压应大于低压。" : "请按血糖仪显示填写大于 0 的数值。");
      return;
    }
    const now = new Date();
    const previous = original ? new Date(original.measuredAt) : null;
    const date = customTime ? (previous && measuredAt === localDateTimeInput(previous) ? previous : new Date(measuredAt)) : now;
    if (!Number.isFinite(date.getTime()) || date > now) {
      setFormError("请填写已经测量的日期和时间。");
      return;
    }

    const details = {
      id: original?.id ?? crypto.getRandomValues(new Uint32Array(4)).join("-"),
      measuredAt: date.toISOString(), note: note.trim(),
    };
    const reading: Reading = values.kind === "glucose" ? { ...values, ...details, mealContext } : { ...values, ...details };
    setFormError("");
    setSaving(true);
    try {
      const saved = await save((book) => saveReading(book, reading, original), original ? "测量记录和曲线已更新。" : "身体情况已保存。");
      if (!saved) return;
      if (!original) {
        setFirst(""); setSecond(""); setNote(""); setMealContext("unknown"); setMeasuredAt(""); setCustomTime(false);
      }
      onSaved(reading);
    } finally {
      setSaving(false);
    }
  }

  return <form className="care-panel care-form health-reading-form" onSubmit={submit}>
    <h2 ref={formHeading} tabIndex={original || initialKind ? -1 : undefined}>
      {original ? "修改测量记录" : initialKind ? (kind === "glucose" ? "记一次血糖" : "记一次血压") : "新增测量记录"}
    </h2>
    <label>记录类型
      <select value={kind} disabled={saving} onChange={(event) => {
        setKind(event.target.value === "glucose" ? "glucose" : "pressure");
        setFirst(""); setSecond(""); setFormError("");
      }}><option value="pressure">血压</option><option value="glucose">血糖</option></select>
    </label>
    {kind === "pressure" && !original && <figure className="health-meter">
      <figcaption>看着血压计的标记填</figcaption>
      <div className="health-meter-display">
        <div><b>SYS</b><span>高压</span></div>
        <div><b>DIA</b><span>低压</span></div>
      </div>
      <p className="care-note">找到屏幕上的 SYS 和 DIA。中文屏幕上通常直接写「高压」和「低压」。</p>
    </figure>}
    <div className={kind === "pressure" ? "care-input-pair" : undefined}>
      <label>{kind === "pressure" ? "高压（mmHg）" : "血糖（mmol/L）"}
        <input type="number" min={kind === "pressure" ? "1" : "0.01"} step={kind === "pressure" ? "1" : "any"} disabled={saving}
          inputMode={kind === "pressure" ? "numeric" : "decimal"} required value={first} onChange={(event) => setFirst(event.target.value)}/>
      </label>
      {kind === "pressure" && <label>低压（mmHg）
        <input type="number" min="1" step="1" inputMode="numeric" required value={second} disabled={saving}
          onChange={(event) => setSecond(event.target.value)}/>
      </label>}
    </div>
    {kind === "glucose" && <label>什么时候测的
      <select value={mealContext} disabled={saving} onChange={(event) => setMealContext(event.target.value as MealContext)}>
        {mealContexts.map((value) => <option key={value} value={value}>{mealContextLabel[value]}</option>)}
      </select>
    </label>}
    <div className="health-reading-time">
      {customTime ? <label>测量日期和时间
        <input ref={dateInput} type="datetime-local" required value={measuredAt} disabled={saving} onChange={(event) => setMeasuredAt(event.target.value)}/>
      </label> : <p>测量时间 <strong>刚刚</strong></p>}
      {!original && <button type="button" className="care-button" disabled={saving}
        onClick={customTime ? () => setCustomTime(false) : adjustTime}>{customTime ? "用现在时间" : "改时间"}</button>}
    </div>
    <label>当时的情况（选填）
      <input value={note} maxLength={100} disabled={saving} onChange={(event) => setNote(event.target.value)}/>
    </label>
    {formError && <p className="care-error" role="alert">{formError}</p>}
    <div className="care-actions health-reading-actions">
      <button className="care-button care-primary" type="submit" disabled={saving}>
        {saving ? "正在保存…" : original ? "保存修改" : "保存测量记录"}
      </button>
      {onCancel && <button className="care-button" type="button" disabled={saving} onClick={onCancel}>取消修改</button>}
    </div>
  </form>;
}
