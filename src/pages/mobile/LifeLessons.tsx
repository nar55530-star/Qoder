import { type ReactNode } from "react";
import LessonSteps from "@/components/mobile/LessonSteps";

type SceneItem =
  | { k: "ticket"; no: string; wait: string; hi?: boolean }
  | { k: "counter"; text: string; hi?: boolean }
  | { k: "keypad"; hi?: boolean }
  | { k: "slip"; title: string; lines: string[]; hi?: boolean }
  | { k: "screen"; text: string; hi?: boolean }
  | { k: "note"; text: string };

type LifeStep = { title: string; text: string; scene: SceneItem[]; hiText?: string };
type LifeLesson = { key: string; title: string; steps: LifeStep[]; tip: string; fraud?: string };

export const lifeLessons: LifeLesson[] = [
  {
    key: "bank",
    title: "存钱取钱",
    tip: "一次取 5 万元以上，要提前一天给银行打电话预约。",
    fraud: "银行不会打电话让您把钱转到「安全账户」——接到这种电话，直接挂掉。",
    steps: [
      {
        title: "出门前带齐东西",
        text: "身份证、银行卡（或存折）、要存的钱，放进贴身的口袋，拉链拉好，别露在外面。",
        scene: [{ k: "slip", title: "随身清单", lines: ["身份证", "银行卡 / 存折", "要存的钱"], hi: true }]
      },
      {
        title: "进门先取号",
        text: "在门口的取号机上按「个人业务」，拿一张小票，然后坐着等叫号就行，不用一直站着排队。",
        scene: [{ k: "ticket", no: "A 023", wait: "前面还有 3 人", hi: true }],
        hiText: "取号机一般在进门处，找不到就问大堂的工作人员"
      },
      {
        title: "叫到号，去窗口",
        text: "听到广播叫您的号，看清是几号窗口，走过去把证件和钱递进去，说「存钱」或「取钱」。",
        scene: [{ k: "counter", text: "请 A023 到 3 号窗口", hi: true }]
      },
      {
        title: "输密码，核对金额",
        text: "在密码器上输密码，用手挡着点，别让旁边的人看到；窗口屏幕上的金额看一眼对不对，再签字。",
        scene: [{ k: "keypad", hi: true }],
        hiText: "密码只有您自己知道，工作人员不会问您要密码"
      },
      {
        title: "收好东西再走",
        text: "拿好回执单、身份证、银行卡，数一遍再离开。钱和证件都收进贴身口袋。",
        scene: [{ k: "slip", title: "回执单（示意）", lines: ["业务：存款 / 取款", "金额：以窗口办理为准"] }]
      }
    ]
  },
  {
    key: "hospital",
    title: "挂号和缴费",
    tip: "药盒上写的用法和医生说的不一样时，先打电话问医院或家人，别自己猜。",
    fraud: "医院不会打电话说「医保卡异常要转账」；陌生人推荐的「特效药」不要买。",
    steps: [
      {
        title: "带上证件",
        text: "去医院前把身份证、医保卡（社保卡）带齐；手机也带上，缴费扫码时用得上。",
        scene: [{ k: "slip", title: "随身清单", lines: ["身份证", "医保卡（社保卡）", "手机"], hi: true }]
      },
      {
        title: "先挂号",
        text: "在自助机或挂号窗口挂号。不知道挂哪个科，先问门口的导诊台，说哪里不舒服就行，他们会帮您选。",
        scene: [{ k: "slip", title: "挂号单（示意）", lines: ["科室：内科", "诊室：3 诊室", "序号：12"], hi: true }]
      },
      {
        title: "等叫名字再看诊",
        text: "按挂号单找到诊室，在门口坐着等，屏幕叫到您的名字再进去，不用着急。",
        scene: [{ k: "screen", text: "3 诊室 · 请 12 号 就诊", hi: true }]
      },
      {
        title: "缴费",
        text: "医生看完开了单子，去收费窗口或自助机缴费，可以用医保卡；发票拿好，后面取药要用。",
        scene: [{ k: "slip", title: "缴费发票（示意）", lines: ["费用：以医生开单为准", "医保：可用医保卡结算"], hi: true }]
      },
      {
        title: "取药",
        text: "按发票上的提示到药房窗口，把单子交进去，等叫名字取药。拿药时问清楚：一天吃几次、一次吃几片。",
        scene: [{ k: "counter", text: "药房 · 请交单等叫名", hi: true }]
      }
    ]
  }
];

function Hi({ children }: { children: ReactNode }) {
  return <span className="wx-hi"><span className="wx-hi-tag">看这里</span>{children}</span>;
}

function SceneView({ item }: { item: SceneItem }) {
  switch (item.k) {
    case "ticket":
      return item.hi
        ? <Hi><span className="scene-ticket"><strong>{item.no}</strong><span>{item.wait}</span></span></Hi>
        : <span className="scene-ticket"><strong>{item.no}</strong><span>{item.wait}</span></span>;
    case "counter":
      return item.hi
        ? <Hi><span className="scene-counter">{item.text}</span></Hi>
        : <span className="scene-counter">{item.text}</span>;
    case "keypad":
      return item.hi
        ? <Hi><span className="scene-keypad">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => <i key={n}>{n}</i>)}</span></Hi>
        : <span className="scene-keypad">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => <i key={n}>{n}</i>)}</span>;
    case "slip":
      return item.hi
        ? <Hi><span className="scene-slip"><span className="scene-slip-title">{item.title}</span>{item.lines.map(l => <span key={l} className="scene-slip-line">{l}</span>)}</span></Hi>
        : <span className="scene-slip"><span className="scene-slip-title">{item.title}</span>{item.lines.map(l => <span key={l} className="scene-slip-line">{l}</span>)}</span>;
    case "screen":
      return item.hi
        ? <Hi><span className="scene-screen">{item.text}</span></Hi>
        : <span className="scene-screen">{item.text}</span>;
    case "note":
      return <span className="wx-little">{item.text}</span>;
  }
}

function LifeScene({ items }: { items: SceneItem[] }) {
  return <div className="scene" aria-hidden="true">{items.map((item, i) => <SceneView key={i} item={item}/>)}</div>;
}

export default function LifeLessonPage({ lessonKey }: { lessonKey: string }) {
  const lesson = lifeLessons.find(l => l.key === lessonKey);
  if (!lesson) return <LessonSteps tone="orange" storageKey={`mm-lesson-${lessonKey}`} backTo="/life" lesson={{ title: "课程还在准备中", steps: [{ title: "这节课还没做好", text: "做好后就能学了，先看看别的吧。" }] }}/>;
  return <LessonSteps
    tone="orange"
    storageKey={`mm-lesson-${lesson.key}`}
    backTo="/life"
    mockNote="生活场景 · 简化示意图（不是真实照片）"
    lesson={{
      title: lesson.title,
      tip: lesson.tip,
      fraud: lesson.fraud,
      steps: lesson.steps.map(s => ({ title: s.title, text: s.text, hint: s.hiText, mock: <LifeScene items={s.scene}/> }))
    }}
  />;
}
