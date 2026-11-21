import { localDay, type Medication } from "./health.ts";

const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function medicationReminderTimes(plans: Pick<Medication, "time">[]) {
  return [...new Set(plans.map(({ time }) => time).filter((time) => validTime.test(time)))].sort();
}

export function buildMedicationCalendar(plans: Pick<Medication, "time">[], now = new Date()) {
  const times = medicationReminderTimes(plans);
  if (!times.length) return null;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDay = localDay(tomorrow).replace(/-/g, "");
  const timestamp = now.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const batchId = crypto.getRandomValues(new Uint32Array(2)).join("-");
  const events = times.flatMap((time) => {
    const startTime = time.replace(":", "");
    return [
      "BEGIN:VEVENT",
      "UID:" + batchId + "-" + startDay + "-" + startTime + "@manmanban",
      "DTSTAMP:" + timestamp,
      "DTSTART:" + startDay + "T" + startTime + "00",
      "DURATION:PT5M",
      "RRULE:FREQ=DAILY;COUNT=30",
      "SUMMARY:核对用药计划",
      "CLASS:PRIVATE",
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "TRIGGER:PT0M",
      "ACTION:DISPLAY",
      "DESCRIPTION:请核对医生交代的用药计划。",
      "END:VALARM",
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Manmanban//Care Reminders//ZH", ...events, "END:VCALENDAR", ""].join("\r\n");
}
