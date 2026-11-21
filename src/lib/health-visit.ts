import { emptyVisitNotes, localDay, readingLabel, readingValueLabel, type HealthBook, type VisitNotes } from "./health.ts";
import { readingWindowStart, selectRecentReadings } from "./health-trends.ts";

export type VisitPeriod = 7 | 30;
export type VisitNotesDraft = Partial<Record<keyof VisitNotes, { original: string; value: string }>>;
const noteFields = ["concerns", "questions"] as const;
const timeLabel = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function visitDateTime(timestamp: string) {
  const date = new Date(timestamp);
  return localDay(date) + " " + timeLabel.format(date);
}

export function buildVisitSummary(book: HealthBook, days: VisitPeriod, now = new Date()) {
  return {
    from: localDay(readingWindowStart(days, now)),
    through: localDay(now),
    plans: [...book.plans].sort((first, second) => first.time.localeCompare(second.time)),
    readings: selectRecentReadings(book.readings, days, now).reverse(),
  };
}

export function formatVisitSummary(summary: ReturnType<typeof buildVisitSummary>, notes: VisitNotes) {
  const plans = summary.plans.map(({ time, name, instructions }) => [time, name, instructions].filter(Boolean).join(" · "));
  const readings = summary.readings.map((reading) => [
    visitDateTime(reading.measuredAt), readingLabel(reading), readingValueLabel(reading), reading.note,
  ].filter(Boolean).join(" · "));
  return [
    "慢慢办｜复诊清单",
    "当前用药计划（本人记录）\n" + (plans.length ? plans.join("\n") : "暂无用药计划"),
    "家庭测量（" + summary.from + " 至 " + summary.through + "）\n" + (readings.length ? readings.join("\n") : "这段时间暂无测量记录"),
    notes.concerns.trim() ? "最近的情况\n" + notes.concerns.trim() : "",
    notes.questions.trim() ? "想问医生的问题\n" + notes.questions.trim() : "",
  ].filter(Boolean).join("\n\n");
}

export class VisitNotesChangedError extends Error {
  constructor() {
    super("Visit note has changed");
    this.name = "VisitNotesChangedError";
  }
}

export function applyVisitNotesEdits(book: HealthBook, draft: VisitNotesDraft): HealthBook {
  const visitNotes = { ...emptyVisitNotes, ...book.visitNotes };
  for (const field of noteFields) {
    const edit = draft[field];
    if (!edit) continue;
    const value = edit.value.trim();
    if (visitNotes[field] !== edit.original && visitNotes[field] !== value) throw new VisitNotesChangedError();
    visitNotes[field] = value;
  }
  return { ...book, visitNotes };
}
