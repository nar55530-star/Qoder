export type Medication = { id: string; name: string; time: string; instructions: string };
export type Intake = {
  planId: string; day: string; recordedAt: string; name: string;
  scheduledTime: string; instructions: string;
};
export type MealContext = "fasting" | "after-meal" | "unknown";
export const mealContextLabel: Record<MealContext, string> = { fasting: "空腹", "after-meal": "餐后", unknown: "未注明" };
export type ReadingValues =
  | { kind: "pressure"; systolic: number; diastolic: number }
  | { kind: "glucose"; glucose: number; mealContext?: MealContext };
export type Reading = ReadingValues & { id: string; measuredAt: string; note: string };
export type HealthBook = { plans: Medication[]; intakes: Intake[]; readings: Reading[] };

const storageKey = "mm-health-v1";
export const emptyHealthBook: HealthBook = { plans: [], intakes: [], readings: [] };

export function readHealthBook(): HealthBook {
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) return emptyHealthBook;
  const book = JSON.parse(raw) as HealthBook;
  if (!book || !Array.isArray(book.plans) || !Array.isArray(book.intakes) || !Array.isArray(book.readings)) {
    throw new Error("Invalid health records");
  }
  return book;
}

export async function updateHealthBook(update: (book: HealthBook) => HealthBook): Promise<HealthBook> {
  const persist = () => {
    const next = update(readHealthBook());
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  };
  return navigator.locks ? navigator.locks.request(storageKey, persist) : persist();
}

export function localDay(date: Date) {
  const two = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

export function medicationStatus(intakes: Intake[], planId: string, day: string) {
  return intakes.find((intake) => intake.planId === planId && intake.day === day);
}

export function saveMedicationPlan(book: HealthBook, draft: Medication, editing: string | null, date: Date): HealthBook {
  if (!editing) return { ...book, plans: [...book.plans, draft] };
  const previous = book.plans.find((plan) => plan.id === editing);
  if (!previous) throw new Error("Missing plan");
  const changed = previous.name !== draft.name || previous.time !== draft.time || previous.instructions !== draft.instructions;
  const hasIntakeToday = medicationStatus(book.intakes, previous.id, localDay(date));
  const next = changed && hasIntakeToday ? draft : { ...draft, id: previous.id };
  return { ...book, plans: book.plans.map((plan) => plan.id === editing ? next : plan) };
}

export function recordTaken(intakes: Intake[], plan: Medication, date: Date): Intake[] {
  const day = localDay(date);
  if (medicationStatus(intakes, plan.id, day)) return intakes;
  return [{
    planId: plan.id,
    day,
    recordedAt: date.toISOString(),
    name: plan.name,
    scheduledTime: plan.time,
    instructions: plan.instructions,
  }, ...intakes];
}

export function undoTaken(intakes: Intake[], planId: string, day: string) {
  return intakes.filter((intake) => intake.planId !== planId || intake.day !== day);
}

export function readingValues(kind: ReadingValues["kind"], first: string, second: string): ReadingValues | null {
  if (kind === "glucose") {
    const glucose = Number(first);
    return Number.isFinite(glucose) && glucose > 0 ? { kind, glucose } : null;
  }
  const systolic = Number(first);
  const diastolic = Number(second);
  return Number.isInteger(systolic) && Number.isInteger(diastolic) && diastolic > 0 && systolic > diastolic
    ? { kind, systolic, diastolic }
    : null;
}
