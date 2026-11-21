import { useState } from "react";
import { AlarmClock, CalendarClock, Check, Clock3, Plus } from "lucide-react";
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

  return <section className="care-panel medication-reminders" aria-label="用药提醒设置">
    <details className="care-details medication-alarm">
      <summary><AlarmClock size={21} aria-hidden="true"/>用手机闹钟提醒</summary>
      <p className="medication-reminder-times">计划时间 {times.join(" · ")}</p>
      <ol className="medication-alarm-steps">
        <li><Clock3 size={22} aria-hidden="true"/><span><strong>找到闹钟</strong>打开手机的「时钟」，点「闹钟」。</span></li>
        <li><Plus size={22} aria-hidden="true"/><span><strong>设好时间</strong>点「＋」或「添加」，填上计划时间，在「重复」里选每一天。</span></li>
        <li><Check size={22} aria-hidden="true"/><span><strong>保存并打开</strong>点「完成」或「保存」，确认闹钟开关已打开。</span></li>
      </ol>
      <p className="care-note">闹钟响时，先核对自己的用药记录。计划时间改了，记得改手机闹钟。</p>
      <div className="care-actions medication-alarm-links">
        <a className="care-text-button" href="https://support.apple.com/zh-cn/118444" target="_blank" rel="noreferrer">苹果手机说明</a>
        <a className="care-text-button" href="https://support.google.com/android/answer/2840926?hl=zh-Hans" target="_blank" rel="noreferrer">安卓手机说明</a>
      </div>
    </details>
    <details className="care-details medication-calendar">
      <summary><CalendarClock size={20} aria-hidden="true"/>在手机日历设提醒</summary>
      <p className="care-note">按当前计划生成从明天起连续 30 天的日历。文件里显示时间和「核对用药计划」。</p>
      <p className="medication-reminder-times">{times.join(" · ")}</p>
      <button type="button" className="care-button care-primary" onClick={saveCalendar}>下载日历提醒</button>
      <p className="care-note">用支持 .ics 的日历导入后，请检查提醒设置。计划变化时，请更新日历，重新导入前先删除旧提醒。</p>
      <div className="health-visit-status" role="status">{status}</div>
    </details>
  </section>;
}
