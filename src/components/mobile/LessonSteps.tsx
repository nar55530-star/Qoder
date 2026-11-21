import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export type LessonStepView = { title: string; text: string; hint?: string; mock?: ReactNode };
export type LessonView = { title: string; steps: LessonStepView[]; tip?: string; fraud?: string };

export default function LessonSteps({ lesson, tone = "green", storageKey, backTo, mockNote }: {
  lesson: LessonView;
  tone?: string;
  storageKey: string;
  backTo: string;
  mockNote?: string;
}) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey) || "0");
    return Number.isInteger(saved) && saved >= 1 ? saved : 1;
  });

  useEffect(() => {
    const saved = Number(localStorage.getItem(storageKey) || "0");
    if (saved >= 2 && saved <= lesson.steps.length) toast(`接着上次，从第 ${saved} 步继续学。`);
  }, []);

  useEffect(() => { localStorage.setItem(storageKey, String(stepIndex)); }, [stepIndex, storageKey]);

  const step = lesson.steps[stepIndex - 1];
  const total = lesson.steps.length;
  const atEnd = stepIndex === total;

  const finish = () => { localStorage.removeItem(storageKey); navigate(backTo); toast("学完啦，记不住随时回来再看。"); };
  const restart = () => { setStepIndex(1); toast("好，咱们从头再看一遍。"); };

  return (
    <div className={`category-page page-enter tone-page-${tone} lesson-page`}>
      <header className="category-head">
        <button className="back-btn" onClick={() => navigate(backTo)} aria-label="返回"><ArrowLeft size={28}/></button>
        <div>
          <p>{lesson.title}</p>
          <h1>第 {stepIndex} 步 · 共 {total} 步</h1>
          <span>{step.title}</span>
        </div>
      </header>
      <div className="step-dots" aria-label="学习进度">
        {lesson.steps.map((s, i) => <span key={s.title} className={`step-dot ${i < stepIndex ? "is-done" : ""} ${i === stepIndex - 1 ? "is-now" : ""}`}>{i + 1}</span>)}
      </div>
      <main className="lesson-main">
        <section className="step-card">
          <h2>{step.title}</h2>
          <p>{step.text}</p>
          {step.hint ? <p className="step-hint">↳ {step.hint}</p> : null}
          {step.mock}
          {step.mock && mockNote ? <p className="wx-note">{mockNote}</p> : null}
        </section>
        {lesson.fraud ? <aside className="fraud-banner"><strong>防骗提醒</strong><span>{lesson.fraud}</span><Link className="fraud-read-more" to="/fraud">看看怎么核实</Link></aside> : null}
        {lesson.tip ? <p className="lesson-tip">小提示：{lesson.tip}</p> : null}
      </main>
      <nav className="lesson-controls">
        {atEnd
          ? <>
              <button className="talk-btn" onClick={finish}>学完啦，回列表</button>
              <button className="anim-toggle" onClick={restart}>没记住，再看一遍</button>
            </>
          : <>
              <button className="lesson-prev" onClick={() => setStepIndex(n => Math.max(1, n - 1))} disabled={stepIndex === 1}>上一步</button>
              <button className="talk-btn" onClick={() => setStepIndex(n => Math.min(total, n + 1))}>下一步</button>
            </>}
      </nav>
    </div>
  );
}
