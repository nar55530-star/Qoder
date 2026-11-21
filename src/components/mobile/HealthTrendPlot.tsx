import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Reading } from "@/lib/health";
import type { TrendKind } from "@/lib/health-trends";

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

export default function HealthTrendPlot({ readings, kind }: { readings: Reading[]; kind: TrendKind }) {
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
