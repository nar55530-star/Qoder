import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { downloadFile } from "@/lib/download";
import type { Medication } from "@/lib/health";
import { buildMedicationCalendar, medicationReminderTimes } from "@/lib/health-reminders";

export function MedicationReminder({ plans }: { plans: Medication[] }) {
  const [status, setStatus] = useState("");
  const times = medicationReminderTimes(plans);
  if (!times.length) return null;

  function saveCalendar() {
    const calendar = buildMedicationCalendar(plans);
    if (!calendar) return;
    downloadFile("慢慢办-用药日历提醒.ics", calendar, "text/calendar;charset=utf-8");
    setStatus("请在日历中导入文件，并检查提醒是否开启。");
  }

  return <details className="care-panel care-details medication-reminders">
    <summary><CalendarClock size={20} aria-hidden="true"/>在手机日历设提醒</summary>
    <p className="care-note">按当前计划生成从明天起连续 30 天的日历。文件里显示时间和「核对用药计划」。</p>
    <p className="medication-reminder-times">{times.join(" · ")}</p>
    <button type="button" className="care-button care-primary" onClick={saveCalendar}>下载日历提醒</button>
    <p className="care-note">用支持 .ics 的日历导入后，请检查提醒设置。计划变化时，请更新日历，重新导入前先删除旧提醒。也可按上述时间设置手机闹钟。</p>
    <div className="health-visit-status" role="status">{status}</div>
  </details>;
}
