import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown, ArrowUpRight, Check, ChevronRight, Gift, HandCoins, KeyRound,
  Link2, Phone, ScreenShare, ShieldAlert, Video, Volume2, VolumeX,
} from "lucide-react";
import CarePage, { type CareTextProps } from "@/components/mobile/CarePage";

const scenarios = [
  {
    label: "有人让我转账", Icon: HandCoins,
    prompt: "对方催您把钱转到所谓的「安全账户」。",
    first: "先别转钱，挂断电话。",
    steps: ["自行打开官方 App，或拨打卡片、官网上的客服电话核实。", "可以先打给家人商量，按自己的节奏处理。"],
    wrong: "按对方给的账户转钱",
    right: "挂断后，自己找官方电话核实",
  },
  {
    label: "有人要验证码", Icon: KeyRound,
    prompt: "有人自称客服，说要验证码才能取消扣费。",
    first: "把验证码留在自己手机上。",
    steps: ["停止通话或聊天，保留对方发来的消息。", "自己进入原平台，在官方客服入口核实是否真的有扣费。"],
    wrong: "报出刚收到的验证码",
    right: "打开原平台找官方客服",
  },
  {
    label: "让我共享屏幕", Icon: ScreenShare,
    prompt: "对方要您共享手机屏幕，再打开手机银行。",
    first: "拒绝共享。已经开启时，先结束共享。",
    steps: ["退出通话，离开共享界面。", "如果无法结束共享，可以先关闭 Wi-Fi 和移动数据。用另一台设备通过官方渠道联系银行。"],
    wrong: "继续共享并打开手机银行",
    right: "结束共享，退出通话",
  },
  {
    label: "熟人在视频里借钱", Icon: Video,
    prompt: "视频里的人长得像朋友，说突然遇到事，要立刻借钱。",
    first: "先放下转账操作，换个渠道联系本人。",
    steps: ["用通讯录里自己原来存的号码重新打给对方。", "没联系上时，可以找共同认识的人再核实。"],
    wrong: "看见熟悉的脸就转账",
    right: "用之前存过的号码打回去",
  },
  {
    label: "领红包要先交钱", Icon: Gift,
    prompt: "有人说要先交一笔钱，才能领取红包或领奖。",
    first: "先退出页面，保留消息。",
    steps: ["有疑问时，从原平台的官方入口查看活动规则。", "通过自己知道的联系方式问发消息的人，弄清是不是他本人发的。"],
    wrong: "先付款试试",
    right: "退出页面，从官方入口查活动",
  },
  {
    label: "陌生链接催我缴费", Icon: Link2,
    prompt: "短信附了一个缴费链接，说现在不付就会停服务。",
    first: "先放下短信，自己打开原来的服务入口。",
    steps: ["自行进官方 App、公众号或办事平台查看账单。", "如果还拿不准，拨打之前核实过的服务电话。"],
    wrong: "从短信链接提交付款",
    right: "自己打开官方服务核对账单",
  },
];

export default function FraudPage(textProps: CareTextProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [choice, setChoice] = useState<"pause" | "continue" | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const helpHeading = useRef<HTMLHeadingElement>(null);
  const scenario = selected === null ? null : scenarios[selected];

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  useEffect(() => {
    if (selected === null) return;
    resultHeading.current?.focus({ preventScroll: true });
    resultHeading.current?.scrollIntoView({ block: "start" });
  }, [selected]);

  function readScenario() {
    const speech = window.speechSynthesis;
    if (!speech || !window.SpeechSynthesisUtterance || !scenario) {
      setSpeechStatus("此浏览器暂时无法朗读，可以直接看下面的步骤。");
      return;
    }
    if (speaking) {
      speech.cancel();
      setSpeaking(false);
      setSpeechStatus("已停止朗读。");
      return;
    }
    const utterance = new SpeechSynthesisUtterance([scenario.first, ...scenario.steps].join(""));
    utterance.lang = "zh-CN";
    utterance.rate = 0.83;
    utterance.onend = () => { setSpeaking(false); setSpeechStatus("已读完。"); };
    utterance.onerror = ({ error }) => {
      if (error === "canceled" || error === "interrupted") return;
      setSpeaking(false);
      setSpeechStatus("暂时无法朗读，可以继续看文字。");
    };
    speech.speak(utterance);
    setSpeaking(true);
    setSpeechStatus("正在朗读这条提醒。");
  }

  return <CarePage {...textProps} title="防骗提醒" description="接到可疑消息或电话时，看看下一步怎么做。" tone="purple">
    <section className="care-summary fraud-summary" aria-labelledby="fraud-first">
      <div className="care-summary-heading">
        <span className="care-emblem"><ShieldAlert size={28} aria-hidden="true"/></span>
        <div><h2 id="fraud-first">拿不准，先别操作</h2><p>暂停转账、提供验证码和共享屏幕，再自行核实。</p></div>
      </div>
      <a href="#fraud-help" className="care-button fraud-help-link"
        onClick={(event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          helpHeading.current?.focus({ preventScroll: true });
          helpHeading.current?.scrollIntoView({ block: "start" });
        }}>
        已经转账或泄露信息 <ArrowDown size={17} aria-hidden="true"/>
      </a>
    </section>
    <section aria-labelledby="scenarios-heading">
      <h2 className="care-section-title" id="scenarios-heading">您遇到了哪种情况？</h2>
      <div className="fraud-options">
        {scenarios.map(({ label, Icon }, index) => (
          <button type="button" className="fraud-option" key={label} aria-pressed={selected === index}
            onClick={() => {
              if (selected === index) {
                resultHeading.current?.focus({ preventScroll: true });
                resultHeading.current?.scrollIntoView({ block: "start" });
                return;
              }
              window.speechSynthesis?.cancel();
              setSpeaking(false);
              setSpeechStatus("");
              setChoice(null);
              setSelected(index);
            }}>
            <span className="care-emblem"><Icon size={23} aria-hidden="true"/></span>
            <span>{label}</span><ChevronRight size={16} aria-hidden="true"/>
          </button>
        ))}
      </div>
    </section>
    {scenario && <section className="care-panel fraud-result" aria-labelledby="scenario-result">
      <p className="fraud-context">{scenario.label}</p>
      <h2 id="scenario-result" ref={resultHeading} tabIndex={-1}>{scenario.first}</h2>
      <ol className="care-steps">
        {scenario.steps.map((step) => <li key={step}><span>{step}</span></li>)}
      </ol>
      <button className="care-button" type="button" onClick={readScenario}>
        {speaking ? <VolumeX size={20} aria-hidden="true"/> : <Volume2 size={20} aria-hidden="true"/>}
        {speaking ? "停止朗读" : "听一遍"}
      </button>
      <p className="care-status" role="status">{speechStatus}</p>
      <div className="fraud-practice">
        <h3>模拟练习</h3>
        <p>{scenario.prompt} 您会怎么做？</p>
        <div className="fraud-answers" role="group" aria-label="练习选项">
          <button type="button" className="care-button" aria-pressed={choice === "continue"} onClick={() => setChoice("continue")}>{scenario.wrong}</button>
          <button type="button" className="care-button" aria-pressed={choice === "pause"} onClick={() => setChoice("pause")}>{scenario.right}</button>
        </div>
        {choice && <p className={`fraud-feedback ${choice === "pause" ? "is-safe" : ""}`} role="status">
          {choice === "pause" && <Check size={19} aria-hidden="true"/>}
          {choice === "pause" ? "做得对，先停下来再核实。" : "先别继续操作。可以换另一项试试。"}
        </p>}
      </div>
    </section>}
    <section className="care-panel fraud-help" aria-labelledby="fraud-help">
      <h2 id="fraud-help" ref={helpHeading} tabIndex={-1}>已经转账或泄露信息</h2>
      <ol className="care-steps">
        <li><span>停止转账和联系对方，立即拨打 110 报警。</span></li>
        <li><span>尽快联系银行或支付平台的官方客服，询问止付或挂失。留存聊天记录和转账凭证。</span></li>
      </ol>
      <div className="care-actions">
        <a className="care-button fraud-call" href="tel:110"><Phone size={19} aria-hidden="true"/>拨打 110 报警</a>
        <Link className="care-button" to="/life/contacts">联系家人</Link>
      </div>
    </section>
    <p className="care-note">如果情况与上面的例子不同，可以先找家人或官方客服核实。</p>
    <a className="care-text-button" href="https://app.www.gov.cn/govdata/gov/202407/25/517630/article.html"
      target="_blank" rel="noreferrer">查看官方防骗提示 <ArrowUpRight size={16} aria-hidden="true"/></a>
  </CarePage>;
}
