import { lazy, Suspense, useId } from "react";
import { TrendingUp } from "lucide-react";
import { mealContextLabel, type MealContext, type Reading } from "@/lib/health";
import { latestGlucoseMealContext, selectTrendReadings, type TrendSelection, type TrendKind, type TrendWindow } from "@/lib/health-trends";
import "./health-trend.css";

const kinds: Record<TrendKind, string> = { pressure: "血压", glucose: "血糖" };
const windows: TrendWindow[] = [7, 30, 90, "all"];
const measurements: TrendKind[] = ["pressure", "glucose"];
const mealContexts: MealContext[] = ["fasting", "after-meal", "unknown"];

const readingLabel = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

const TrendPlot = lazy(() => import("./HealthTrendPlot").catch(() => ({
  default: () => <p className="care-empty">曲线暂时无法加载，请查看下方的测量值。</p>,
})));

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
        <Suspense fallback={<p className="care-empty" role="status">正在绘制曲线…</p>}>
          <TrendPlot readings={selected} kind={selection.kind}/>
        </Suspense>
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
