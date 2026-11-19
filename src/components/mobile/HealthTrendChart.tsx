import { useId } from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mealContextLabel, type MealContext, type Reading } from "@/lib/health";
import { latestGlucoseMealContext, selectTrendReadings, type TrendSelection, type TrendKind, type TrendWindow } from "@/lib/health-trends";
import "./health-trend.css";

const kinds: Record<TrendKind, string> = { pressure: "血压", glucose: "血糖" };
const windows: TrendWindow[] = [7, 30, 90, "all"];
const measurements: TrendKind[] = ["pressure", "glucose"];
const mealContexts: MealContext[] = ["fasting", "after-meal", "unknown"];

const dateLabel = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" });
const yearDateLabel = new Intl.DateTimeFormat("zh-CN", { year: "2-digit", month: "numeric", day: "numeric" });
const timeLabel = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const readingLabel = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const numberLabel = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 2 });

const primaryStroke = "#315f54";
const secondaryStroke = "#90613d";
const tick = { fill: "#6d594c" };
const hour = 60 * 60 * 1000;

function TrendPlot({ readings, kind }: { readings: Reading[]; kind: TrendKind }) {
  const data = readings.map((reading) => ({ ...reading, timestamp: Date.parse(reading.measuredAt) }));
  const first = data[0].timestamp;
  const last = data[data.length - 1].timestamp;
  const firstDay = new Date(first);
  const lastDay = new Date(last);
  const dateFormat = firstDay.toDateString() === lastDay.toDateString()
    ? timeLabel
    : firstDay.getFullYear() === lastDay.getFullYear() ? dateLabel : yearDateLabel;
  const unit = kind === "pressure" ? "mmHg" : "mmol/L";
  const dot = first === last || data.length <= 40 ? { r: 3.5, fill: "#fffdf8", strokeWidth: 2 } : false;

  return (
    <div className="health-trend-graph" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 16, bottom: 3, left: 0, right: 28 }}>
          <CartesianGrid vertical={false} stroke="#ddccb0" strokeDasharray="3 5"/>
          <XAxis dataKey="timestamp" type="number" scale="time"
            domain={first === last ? [first - hour, last + hour] : [first, last]}
            ticks={first === last ? [first] : [first, last]} height={34}
            padding={{ left: 6, right: 6 }} tickLine={false} tickMargin={8}
            axisLine={{ stroke: "#b7a282" }} tick={tick} tickFormatter={(value) => dateFormat.format(value)}/>
          <YAxis width={45} axisLine={false} tickLine={false} tickMargin={6} tick={tick}
            domain={["auto", "auto"]} tickCount={5} allowDecimals={kind === "glucose"}
            tickFormatter={(value) => numberLabel.format(value)}/>
          <Tooltip isAnimationActive={false} labelFormatter={(value) => readingLabel.format(Number(value))}
            contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#afc8b9", borderRadius: ".55rem", maxWidth: "11rem", whiteSpace: "normal" }}/>
          {kind === "pressure" ? <>
            <Line dataKey="systolic" name="高压" unit={` ${unit}`} stroke={primaryStroke} strokeWidth={3}
              dot={dot} activeDot={{ r: 6 }} isAnimationActive={false}/>
            <Line dataKey="diastolic" name="低压" unit={` ${unit}`} stroke={secondaryStroke} strokeWidth={3}
              strokeDasharray="7 5" dot={dot} activeDot={{ r: 6 }} isAnimationActive={false}/>
          </> : <Line dataKey="glucose" name="血糖" unit={` ${unit}`} stroke={primaryStroke} strokeWidth={3}
            dot={dot} activeDot={{ r: 6 }} isAnimationActive={false}/>}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HealthTrendChart({ readings, selection, onSelectionChange }: {
  readings: Reading[];
  selection: TrendSelection;
  onSelectionChange: (selection: TrendSelection) => void;
}) {
  const headingId = useId();
  const isPressure = selection.kind === "pressure";
  const mealContext = selection.mealContext ?? "unknown";
  const selected = selectTrendReadings(readings, selection);
  const label = isPressure ? kinds.pressure : `${kinds.glucose}（${mealContextLabel[mealContext]}）`;

  function changeKind(kind: TrendKind) {
    if (kind === selection.kind) return;
    const next = { ...selection, kind };
    if (kind === "glucose" && !next.mealContext) next.mealContext = latestGlucoseMealContext(readings);
    onSelectionChange(next);
  }

  return (
    <section className="care-panel health-trend" aria-labelledby={headingId}>
      <header className="care-summary-heading">
        <span className="care-emblem"><TrendingUp size={24} aria-hidden="true"/></span>
        <h2 id={headingId}>历史趋势</h2>
      </header>
      <div className="health-trend-options" role="group" aria-label="测量类型">
        {measurements.map((kind) => <button key={kind} type="button" className="care-button"
          aria-pressed={selection.kind === kind} onClick={() => changeKind(kind)}>
          {kinds[kind]}
        </button>)}
      </div>
      {!isPressure && <div className="health-trend-filter">
        <p className="health-trend-filter-label">测量情况</p>
        <div className="health-trend-options health-trend-meals" role="group" aria-label="血糖测量情况">
          {mealContexts.map((context) => <button key={context} type="button" className="care-button"
            aria-pressed={mealContext === context} onClick={() => onSelectionChange({ ...selection, mealContext: context })}>
            {mealContextLabel[context]}
          </button>)}
        </div>
      </div>}
      <div className="health-trend-filter">
        <p className="health-trend-filter-label">时间范围</p>
        <div className="health-trend-options health-trend-windows" role="group" aria-label="时间范围">
          {windows.map((window) => <button key={window} type="button" className="care-button"
            aria-pressed={selection.window === window} aria-label={window === "all" ? "全部时间" : `近 ${window} 天`}
            onClick={() => onSelectionChange({ ...selection, window })}>
            {window === "all" ? "全部" : `${window} 天`}
          </button>)}
        </div>
      </div>
      <p className={selected.length ? "health-trend-count" : "care-empty"} role="status">
        {selected.length ? `${label} · ${selected.length} 条记录` : `这段时间还没有${label}记录。`}
      </p>
      {selected.length > 0 && <>
        <ul className="health-trend-legend" aria-label="曲线图例">
          <li><span className="health-trend-line" aria-hidden="true"/>{isPressure ? "高压" : "血糖"}</li>
          {isPressure && <li><span className="health-trend-line health-trend-line-low" aria-hidden="true"/>低压</li>}
          <li className="health-trend-unit">{isPressure ? "mmHg" : "mmol/L"}</li>
        </ul>
        <TrendPlot readings={selected} kind={selection.kind}/>
        <details className="health-trend-details care-details">
          <summary>查看图中测量值</summary>
          <ul className="care-records">
            {[...selected].reverse().map((reading) => <li key={reading.id} className="care-record">
              <time dateTime={reading.measuredAt}>{readingLabel.format(Date.parse(reading.measuredAt))}</time>
              <strong className="health-trend-value">
                {reading.kind === "pressure"
                  ? `高压 ${reading.systolic} / 低压 ${reading.diastolic} mmHg`
                  : `${reading.glucose} mmol/L`}
              </strong>
            </li>)}
          </ul>
        </details>
      </>}
    </section>
  );
}
