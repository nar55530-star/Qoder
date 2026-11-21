import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown, ArrowUpRight, Check, ChevronRight, Gift, HandCoins, Headphones, KeyRound,
  Link2, Phone, PiggyBank, ScreenShare, ShieldAlert, Video,
} from "lucide-react";
import CarePage, { type CareTextProps } from "@/components/mobile/CarePage";
import { FraudMessageCheck } from "@/components/mobile/FraudMessageCheck";
import { FraudSpeechControls, useFraudSpeech } from "@/components/mobile/FraudSpeech";

const scenarios = [
  {
    id: "transfer",
    label: "有人让我转账", Icon: HandCoins,
    prompt: "对方催您把钱转到所谓的「安全账户」。",
    first: "先别转钱，挂断电话。",
    steps: ["自行打开官方 App，或拨打卡片、官网上的客服电话核实。", "可以先打给家人商量，按自己的节奏处理。"],
    wrong: "按对方给的账户转钱",
    right: "挂断后，自己找官方电话核实",
  },
  {
    id: "code",
    label: "有人要验证码", Icon: KeyRound,
    prompt: "有人自称客服，说要验证码才能取消扣费。",
    first: "把验证码留在自己手机上。",
    steps: ["停止通话或聊天，保留对方发来的消息。", "自己进入原平台，在官方客服入口核实是否真的有扣费。"],
    wrong: "报出刚收到的验证码",
    right: "打开原平台找官方客服",
  },
  {
    id: "screen",
    label: "让我共享屏幕", Icon: ScreenShare,
    prompt: "对方要您共享手机屏幕，再打开手机银行。",
    first: "拒绝共享。已经开启时，先结束共享。",
    steps: ["退出通话，离开共享界面。", "如果无法结束共享，可以先关闭 Wi-Fi 和移动数据。用另一台设备通过官方渠道联系银行。"],
    wrong: "继续共享并打开手机银行",
    right: "结束共享，退出通话",
  },
  {
    id: "family",
    label: "熟人在视频里借钱", Icon: Video,
    prompt: "视频里的人长得像朋友，说突然遇到事，要立刻借钱。",
    first: "先放下转账操作，换个渠道联系本人。",
    steps: ["用通讯录里自己原来存的号码重新打给对方。", "没联系上时，可以找共同认识的人再核实。"],
    wrong: "看见熟悉的脸就转账",
    right: "用之前存过的号码打回去",
  },
  {
    id: "reward",
    label: "领红包要先交钱", Icon: Gift,
    prompt: "有人说要先交一笔钱，才能领取红包或领奖。",
    first: "先退出页面，保留消息。",
    steps: ["有疑问时，从原平台的官方入口查看活动规则。", "通过自己知道的联系方式问发消息的人，弄清是不是他本人发的。"],
    wrong: "先付款试试",
    right: "退出页面，从官方入口查活动",
  },
  {
    id: "link",
    label: "陌生链接催我缴费", Icon: Link2,
    prompt: "短信附了一个缴费链接，说现在不付就会停服务。",
    first: "先放下短信，自己打开原来的服务入口。",
    steps: ["自行进官方 App、公众号或办事平台查看账单。", "如果还拿不准，拨打之前核实过的服务电话。"],
    wrong: "从短信链接提交付款",
    right: "自己打开官方服务核对账单",
  },
  {
    id: "refund",
    label: "客服说要取消扣费", Icon: Headphones,
    prompt: "有人来电说您开通了付费服务，要加他好友才能取消。",
    first: "先挂断，从原 App 查订阅。",
    steps: ["自己打开原平台，查看订单或订阅状态。", "在原平台找官方客服核实，验证码和支付密码留在自己手机里。"],
    wrong: "加对方好友，让他代办",
    right: "挂断，自己查订单和订阅",
  },
  {
    id: "investment",
    label: "养老投资说稳赚", Icon: PiggyBank,
    prompt: "有人推销养老投资，承诺保本高收益，催您今天签字交钱。",
    first: "先把宣传材料留下，再和家人商量。",
    steps: ["先暂停交钱和签约。", "和家人一起从官方渠道核实机构和项目。"],
    wrong: "为了赶优惠，先交一笔钱",
    right: "先核实，再做决定",
  },
] as const;

type ScenarioId = typeof scenarios[number]["id"];

const helpCases = [
  {
    label: "转了钱",
    action: "尽快从银行或支付平台的官方入口询问止付或挂失。保存转账凭证、聊天记录和对方的收款信息。",
  },
  {
    label: "给了验证码或密码",
    action: "尽快通过银行或平台的官方渠道确认账户安全，按客服指引修改密码、冻结账户或挂失。保存相关短信和聊天记录。",
  },
  {
    label: "开了屏幕共享",
    action: "先结束共享并退出通话。如果设备仍被控制，先关闭网络，再用另一台可信设备联系银行和平台。",
  },
];

export default function FraudPage(textProps: CareTextProps) {
  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [choice, setChoice] = useState<"pause" | "continue" | null>(null);
  const { playback, stop, toggle } = useFraudSpeech();
  const [helpCase, setHelpCase] = useState<number | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const helpHeading = useRef<HTMLHeadingElement>(null);
  const scenario = scenarios.find(({ id }) => id === selected);


  useEffect(() => {
    if (selected === null) return;
    resultHeading.current?.focus({ preventScroll: true });
    resultHeading.current?.scrollIntoView({ block: "start" });
  }, [selected]);

  function chooseScenario(id: ScenarioId) {
    stop();
    if (selected === id) {
      resultHeading.current?.focus({ preventScroll: true });
      resultHeading.current?.scrollIntoView({ block: "start" });
      return;
    }
    setChoice(null);
    setSelected(id);
  }

  function showHelp() {
    stop();
    helpHeading.current?.focus({ preventScroll: true });
    helpHeading.current?.scrollIntoView({ block: "start" });
  }

  return <CarePage {...textProps} title="防骗提醒" description="接到可疑消息或电话时，看看下一步怎么做。" tone="purple">
    <section className="care-summary fraud-summary" aria-labelledby="fraud-first">
      <div className="care-summary-heading">
        <span className="care-emblem"><ShieldAlert size={28} aria-hidden="true"/></span>
        <div><h2 id="fraud-first">拿不准，先别操作</h2><p>暂停转账、提供验证码和共享屏幕，再自行核实。</p></div>
      </div>
      <div className="fraud-quick-actions" role="group" aria-label="遇事先做">
        <button type="button" className="care-button" aria-pressed={selected === "transfer"} onClick={() => chooseScenario("transfer")}>
          <HandCoins size={21} aria-hidden="true"/>有人催我转钱<ChevronRight size={17} aria-hidden="true"/>
        </button>
        <button type="button" className="care-button" aria-pressed={selected === "code"} onClick={() => chooseScenario("code")}>
          <KeyRound size={21} aria-hidden="true"/>有人要我报验证码<ChevronRight size={17} aria-hidden="true"/>
        </button>
        <button type="button" className="care-button fraud-call" onClick={() => { setHelpCase(0); showHelp(); }}>
          <Phone size={21} aria-hidden="true"/>我已经转钱了<ChevronRight size={17} aria-hidden="true"/>
        </button>
      </div>
      <div className="care-actions fraud-quick-links">
        <Link className="care-text-button" to="/life/contacts">打给家人</Link>
        <a href="#fraud-help" className="care-text-button" onClick={(event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          setHelpCase(null);
          showHelp();
        }}>已经转账或泄露信息<ArrowDown size={17} aria-hidden="true"/></a>
      </div>
    </section>
    {scenario && <section className="care-panel fraud-result" aria-labelledby="scenario-result">
      <p className="fraud-context">{scenario.label}</p>
      <h2 id="scenario-result" ref={resultHeading} tabIndex={-1}>{scenario.first}</h2>
      <ol className="care-steps">
        {scenario.steps.map((step) => <li key={step}><span>{step}</span></li>)}
      </ol>
      <div className="care-actions fraud-first-actions">
        <FraudSpeechControls playback={playback?.target === "scenario" ? playback : undefined}
          onRead={() => toggle("scenario", [scenario.first, ...scenario.steps].join(" "))}/>
        <Link className="care-button" to="/life/contacts">找家人商量</Link>
      </div>
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
    <FraudMessageCheck onHelp={() => { setHelpCase(null); showHelp(); }}
      playback={playback?.target === "check" ? playback : undefined}
      onRead={(text, generalAdvice) => toggle("check", text, generalAdvice)} onReset={stop}/>
    <section aria-labelledby="scenarios-heading">
      <h2 className="care-section-title" id="scenarios-heading">更多防骗练习</h2>
      <div className="fraud-options">
        {scenarios.map(({ id, label, Icon }) => (
          <button type="button" className="fraud-option" key={id} aria-pressed={selected === id} onClick={() => chooseScenario(id)}>
            <span className="care-emblem"><Icon size={23} aria-hidden="true"/></span>
            <span>{label}</span><ChevronRight size={16} aria-hidden="true"/>
          </button>
        ))}
      </div>
    </section>
    <section className="care-panel fraud-help" aria-labelledby="fraud-help">
      <h2 id="fraud-help" ref={helpHeading} tabIndex={-1}>已经转账或泄露信息</h2>
      <p className="care-note">先停止转账和通话。怀疑被骗时，请尽快拨打 110 报警。</p>
      <div className="care-actions">
        <a className="care-button fraud-call" href="tel:110"><Phone size={19} aria-hidden="true"/>拨打 110 报警</a>
        <Link className="care-button" to="/life/contacts">联系家人</Link>
      </div>
      <div className="fraud-next">
        <h3 id="fraud-next-heading">已经做了哪一步？</h3>
        <div className="care-actions" role="group" aria-labelledby="fraud-next-heading">
          {helpCases.map(({ label }, index) => <button className="care-button" type="button" key={label}
            aria-pressed={helpCase === index} onClick={() => setHelpCase(index)}>{label}</button>)}
        </div>
        <p className="fraud-next-action" aria-live="polite">{helpCase === null
          ? "先保留短信、聊天和付款记录。发现已经扣款，请尽快联系银行或支付平台的官方客服。"
          : helpCases[helpCase].action}</p>
      </div>
    </section>
    <a className="care-text-button" href="https://www.zhengzhou.gov.cn/news4/9490918.jhtml"
      target="_blank" rel="noreferrer">查看警方防骗提示 <ArrowUpRight size={16} aria-hidden="true"/></a>
  </CarePage>;
}
