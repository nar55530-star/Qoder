import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, ClipboardList, Copy, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { downloadFile } from "@/lib/download";
import { emptyVisitNotes, readingLabel, readingValueLabel, type HealthBook, type SaveBook, type VisitNotes } from "@/lib/health";
import { applyVisitNotesEdits, buildVisitSummary, formatVisitSummary, visitDateTime, type VisitNotesDraft, type VisitPeriod } from "@/lib/health-visit";

const periods: VisitPeriod[] = [7, 30];

export function HealthVisit({ book, today, save, saveStatus, clearStatus }: {
  book: HealthBook; today: Date; save: SaveBook; saveStatus: string; clearStatus: () => void;
}) {
  const [period, setPeriod] = useState<VisitPeriod>(7);
  const [draft, setDraft] = useState<VisitNotesDraft>({});
  const [saving, setSaving] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [showCopyBox, setShowCopyBox] = useState(false);
  const copyBox = useRef<HTMLTextAreaElement>(null);
  const savedNotes = { ...emptyVisitNotes, ...book.visitNotes };
  const notes = { concerns: draft.concerns?.value ?? savedNotes.concerns, questions: draft.questions?.value ?? savedNotes.questions };
  const hasDraft = Boolean(draft.concerns || draft.questions);
  const summary = useMemo(() => buildVisitSummary(book, period, new Date()), [book, period, today]);
  const report = formatVisitSummary(summary, notes);
  const hasContent = Boolean(summary.plans.length || summary.readings.length || notes.concerns.trim() || notes.questions.trim());

  useEffect(() => {
    if (showCopyBox) { copyBox.current?.focus(); copyBox.current?.select(); }
  }, [showCopyBox]);

  function editNote(field: keyof VisitNotes, value: string) {
    setDraft((previous) => ({ ...previous, [field]: { value, original: previous[field]?.original ?? savedNotes[field] } }));
  }

  async function saveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !hasDraft) return;
    setSaving(true);
    try {
      if (await save((current) => applyVisitNotesEdits(current, draft), "就诊笔记已保存到这台设备。")) setDraft({});
    } finally {
      setSaving(false);
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setShareStatus("已复制清单。可以粘贴给医生或家人。");
      setShowCopyBox(false);
    } catch {
      setShowCopyBox(true);
      setShareStatus("请长按下方文字，或用键盘复制。");
      copyBox.current?.focus();
      copyBox.current?.select();
    }
  }

  function downloadReport() {
    downloadFile("慢慢办-复诊清单-" + summary.through + ".txt", "\uFEFF" + report, "text/plain;charset=utf-8");
    setShareStatus("已请求保存文字文件。");
  }

  return <>
    <form className="care-panel care-form" onSubmit={saveNotes}>
      <h2>先把想说的话记下来</h2>
      <label>最近的情况（选填）
        <textarea rows={2} maxLength={400} value={notes.concerns} disabled={saving}
          placeholder="例如从什么时候开始不舒服"
          onChange={(event) => editNote("concerns", event.target.value)}/>
      </label>
      <label>想问医生的问题（选填）
        <textarea rows={2} maxLength={400} value={notes.questions} disabled={saving}
          placeholder="例如下次什么时候复查"
          onChange={(event) => editNote("questions", event.target.value)}/>
      </label>
      <div className="care-actions health-reading-actions">
        <button className="care-button care-primary" type="submit" disabled={saving || !hasDraft}>
          {saving ? "正在保存…" : "保存就诊笔记"}
        </button>
        {hasDraft && <button className="care-button" type="button" disabled={saving} onClick={() => {
          if (window.confirm("放弃尚未保存的修改，查看已保存的笔记？")) { setDraft({}); clearStatus(); }
        }}>查看已保存的笔记</button>}
      </div>
      <p className="care-status" role="status">{saveStatus}</p>
    </form>
    <section className="care-panel health-visit-summary" aria-labelledby="visit-summary-title">
      <header className="care-summary-heading">
        <span className="care-emblem"><ClipboardList size={23} aria-hidden="true"/></span>
        <h2 id="visit-summary-title">给医生看的复诊清单</h2>
      </header>
      <p className="care-note">清单根据本机记录和上方填写的内容生成。就诊时可打开给医生看。</p>
      <div className="health-visit-group">
        <h3>用药计划</h3>
        {summary.plans.length > 0
          ? <ul className="care-records">{summary.plans.map(({ id, time, name, instructions }) => <li className="care-record" key={id}>
            <div className="care-record-heading"><strong>{name}</strong><time dateTime={time}>{time}</time></div>
            {instructions && <p className="care-note">{instructions}</p>}
          </li>)}</ul>
          : <p className="care-note">还没有用药计划。</p>}
        <p className="care-note">就诊时可以带上药盒和其他用药清单，告诉医生已知的药物过敏情况。</p>
        <Link className="care-text-button" to="/health/medication">看用药计划</Link>
      </div>
      <div className="health-visit-group">
        <h3 id="visit-measurements">家庭测量</h3>
        <div className="care-actions health-visit-period" role="group" aria-labelledby="visit-measurements">
          {periods.map((days) => <button key={days} type="button" className="care-button" aria-pressed={period === days}
            onClick={() => { setPeriod(days); setShareStatus(""); }}>最近 {days} 天</button>)}
        </div>
        <p className="care-note">{summary.from} 至 {summary.through} · {summary.readings.length} 条记录</p>
        {summary.readings.length > 0
          ? <details className="care-details health-visit-readings">
            <summary>查看这段时间的测量</summary>
            <ul className="care-records">{summary.readings.map((reading) => <li className="care-record" key={reading.id}>
              <div className="care-record-heading"><strong>{readingLabel(reading)}</strong><time dateTime={reading.measuredAt}>{visitDateTime(reading.measuredAt)}</time></div>
              <p className="care-reading-value">{readingValueLabel(reading)}</p>
              {reading.note && <p className="care-note">{reading.note}</p>}
            </li>)}</ul>
          </details>
          : <Link className="care-text-button" to="/health/readings">去记一次测量</Link>}
      </div>
      <div className="health-visit-share">
        <div className="care-actions">
          <button className="care-button care-primary" type="button" disabled={!hasContent} onClick={copyReport}>
            <Copy size={18} aria-hidden="true"/>复制清单
          </button>
          <button className="care-button" type="button" disabled={!hasContent} onClick={downloadReport}>
            <Download size={18} aria-hidden="true"/>保存为文字文件
          </button>
        </div>
        <p className="care-note">复制或保存的清单含健康信息。请只分享给您信任的人。</p>
        <div className="health-visit-status" role="status">{shareStatus}</div>
        {showCopyBox && <label className="care-form health-visit-copy">清单文字
          <textarea ref={copyBox} readOnly value={report} rows={8}/>
        </label>}
      </div>
    </section>
    <a className="care-text-button" href="https://www.ezhou.gov.cn/gk/xxgkml/ggqysydwxxgk/yy/dsyy/202508/t20250822_721364.html"
      target="_blank" rel="noreferrer">查看卫健部门就诊准备指引 <ArrowUpRight size={16} aria-hidden="true"/></a>
  </>;
}
