import { useEffect, useRef, useState, type FormEvent } from "react";
import { localDay, mealContextLabel, readingValues, saveReading, type MealContext, type Reading, type SaveBook } from "@/lib/health";

const timeLabel = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const mealContexts: MealContext[] = ["unknown", "fasting", "after-meal"];

function localDateTimeInput(date: Date) {
  return Number.isFinite(date.getTime()) ? localDay(date) + "T" + timeLabel.format(date) : "";
}

export function HealthReadingForm({ original, save, onSaved, onCancel }: {
  original?: Reading;
  save: SaveBook;
  onSaved: (reading: Reading) => void;
  onCancel?: () => void;
}) {
  const [kind, setKind] = useState<Reading["kind"]>(original?.kind ?? "pressure");
  const [mealContext, setMealContext] = useState<MealContext>(original?.kind === "glucose" ? original.mealContext ?? "unknown" : "unknown");
  const [first, setFirst] = useState(original ? String(original.kind === "pressure" ? original.systolic : original.glucose) : "");
  const [second, setSecond] = useState(original?.kind === "pressure" ? String(original.diastolic) : "");
  const [measuredAt, setMeasuredAt] = useState(() => localDateTimeInput(original ? new Date(original.measuredAt) : new Date()));
  const [note, setNote] = useState(original?.note ?? "");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const editHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (original) editHeading.current?.focus(); }, [original]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const values = readingValues(kind, first, second);
    if (!values) {
      setFormError(kind === "pressure" ? "请核对血压。高压、低压填写正整数，高压应大于低压。" : "请按血糖仪显示填写大于 0 的数值。");
      return;
    }
    const date = original && measuredAt === localDateTimeInput(new Date(original.measuredAt))
      ? new Date(original.measuredAt) : new Date(measuredAt);
    if (!Number.isFinite(date.getTime()) || date > new Date()) {
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
        setFirst(""); setSecond(""); setNote(""); setMealContext("unknown"); setMeasuredAt(localDateTimeInput(new Date()));
      }
      onSaved(reading);
    } finally {
      setSaving(false);
    }
  }

  return <form className="care-panel care-form health-reading-form" onSubmit={submit}>
    <h2 ref={editHeading} tabIndex={original ? -1 : undefined}>{original ? "修改测量记录" : "新增测量记录"}</h2>
    <label>记录类型
      <select value={kind} disabled={saving} onChange={(event) => {
        setKind(event.target.value === "glucose" ? "glucose" : "pressure");
        setFirst(""); setSecond(""); setFormError("");
      }}><option value="pressure">血压</option><option value="glucose">血糖</option></select>
    </label>
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
    {kind === "glucose" && <label>血糖测量时机
      <select value={mealContext} disabled={saving} onChange={(event) => setMealContext(event.target.value as MealContext)}>
        {mealContexts.map((value) => <option key={value} value={value}>{mealContextLabel[value]}</option>)}
      </select>
    </label>}
    <label>测量时间
      <input type="datetime-local" required value={measuredAt} disabled={saving} onChange={(event) => setMeasuredAt(event.target.value)}/>
    </label>
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
