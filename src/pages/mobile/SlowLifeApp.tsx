import { useEffect, useMemo, useRef, useState, type ElementType, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Heart, Home, MessageCircle, Mic, Send, ShieldAlert, Type, Camera, ThumbsUp, Video, CreditCard, MailOpen, Gift, Landmark, Hospital, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LeafSprig, Xiaoman, xiaomanArt } from "@/components/mobile/Xiaoman";
import WechatLessonPage from "@/pages/mobile/WechatLessons";
import LifeLessonPage from "@/pages/mobile/LifeLessons";
import ContactsPage from "@/pages/mobile/ContactsPage";
import FraudPage from "@/pages/mobile/FraudPage";
import HealthPage from "@/pages/mobile/HealthPage";

type CategoryKey = "wechat" | "life";
type Item = { label: string; desc: string; icon: ElementType; href?: string };

const categories: Record<CategoryKey, { title: string; intro: string; tone: string; note: string; items: Item[] }> = {
  wechat: { title: "学用微信", intro: "一步一步学，学不会就再来一遍。", tone: "green", note: "不赶时间，慢慢学", items: [
    { label: "发朋友圈", icon: Camera, desc: "拍张照片、写句话，分享给家人朋友", href: "/wechat/lesson/moments" }, { label: "点赞和评论", icon: ThumbsUp, desc: "看到喜欢的，点个赞、说句话", href: "/wechat/lesson/like" }, { label: "视频聊天", icon: Video, desc: "和家人面对面说话", href: "/wechat/lesson/video" }, { label: "微信付款", icon: CreditCard, desc: "买东西的时候怎么付钱", href: "/wechat/lesson/pay" }, { label: "领红包", icon: MailOpen, desc: "别人发来的红包怎么收", href: "/wechat/lesson/giftIn" }, { label: "发红包", icon: Gift, desc: "过节给家人发个红包", href: "/wechat/lesson/giftOut" }
  ]},
  life: { title: "生活小帮手", intro: "出门办事不着急，提前看一遍就踏实。", tone: "orange", note: "出门前看一眼，心里更踏实", items: [
    { label: "存钱取钱", icon: Landmark, desc: "去银行存钱、取钱的步骤", href: "/life/lesson/bank" }, { label: "挂号和缴费", icon: Hospital, desc: "医院挂号和缴费怎么办", href: "/life/lesson/hospital" }, { label: "联系家人", icon: Users, desc: "把家人的电话放在这里，想打就打", href: "/life/contacts" }
  ]}
};

const homeEntries = [
  { key: "wechat", label: "学用微信", helper: "手机不会用，慢慢学", icon: MessageCircle, tone: "green" },
  { key: "life", label: "生活小帮手", helper: "办事之前，先看看", icon: Home, tone: "orange" },
  { key: "fraud", label: "防骗提醒", helper: "拿不准，先问问", icon: ShieldAlert, tone: "purple" },
  { key: "health", label: "健康管理", helper: "每天记一点", icon: Heart, tone: "teal" }
] as const;

let greetedThisVisit = false;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useBigText() {
  const [bigText, setBigText] = useState(() => {
    try { return localStorage.getItem("mm-big") === "1"; }
    catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("big-text", bigText);
    try { localStorage.setItem("mm-big", bigText ? "1" : "0"); }
    catch { /* The text size still applies for this visit. */ }
  }, [bigText]);
  return [bigText, setBigText] as const;
}

function TopBrand({ bigText, setBigText }: { bigText: boolean; setBigText: (v: boolean) => void }) {
  return <header className="topbar"><div className="brand"><span className="brand-seal"><span /></span><span>慢慢办</span></div><button className={`bigtext-btn ${bigText ? "is-on" : ""}`} onClick={() => setBigText(!bigText)} aria-pressed={bigText}><Type size={21}/><span>{bigText ? "已开大字" : "大字"}</span></button></header>;
}

function HomePage({ bigText, setBigText }: { bigText: boolean; setBigText: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [animOn, setAnimOn] = useState(() => localStorage.getItem("mm-anim") !== "0");
  const toggleAnim = () => { const next = !animOn; setAnimOn(next); localStorage.setItem("mm-anim", next ? "1" : "0"); };
  const reducedMotion = usePrefersReducedMotion();
  const [waveReady, setWaveReady] = useState(false);
  const [greeting, setGreeting] = useState(false);
  useEffect(() => {
    if (reducedMotion) return;
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    preload.href = xiaomanArt("wave", 480);
    document.head.appendChild(preload);
    const art = new Image();
    art.onload = () => setWaveReady(true);
    art.src = xiaomanArt("wave", 480);
    return () => { preload.remove(); };
  }, [reducedMotion]);
  useEffect(() => {
    if (reducedMotion || !waveReady || greetedThisVisit) return;
    const start = window.setTimeout(() => { greetedThisVisit = true; setGreeting(true); }, 280);
    const end = window.setTimeout(() => setGreeting(false), 3400);
    return () => { window.clearTimeout(start); window.clearTimeout(end); };
  }, [reducedMotion, waveReady]);
  return <div className="home-page page-enter">
    <TopBrand bigText={bigText} setBigText={setBigText}/>
    <section className="welcome"><LeafSprig className="welcome-leaf"/><p className="welcome-kicker">今天也陪着您</p><h1>爷爷奶奶，<br className="welcome-break"/>今天<br className="welcome-big-break"/>想做点什么？</h1><p className="welcome-note"><Sparkles size={17}/>别着急，点一下就能开始</p></section>
    <nav className="entries" aria-label="主要功能">{homeEntries.map(({ key, label, helper, icon: Icon, tone }, index) => <button className={`entry tone-${tone}`} onClick={() => navigate(`/${key}`)} key={key}><span className="entry-number">0{index + 1}</span><span className="entry-icon"><Icon size={31}/></span><span className="entry-copy"><strong>{label}</strong><small>{helper}</small></span><ChevronRight className="entry-arrow" size={22}/></button>)}</nav>
    <section className="buddy-card" aria-label="小慢，智能助手">
      <div className="buddy-copy">
        <span className="buddy-label">您的小帮手</span>
        <div className="bubble">{greeting ? <>爷爷奶奶好<br/>慢慢来就好</> : <>爷爷奶奶好，<br/>有事就来找我。</>}</div>
        <p className="buddy-name">小慢 <span>智能助手</span></p>
      </div>
      <button className={`character-button ${animOn ? "is-floating" : ""} ${greeting ? "is-greeting" : ""}`} onClick={() => navigate("/chat")} aria-label="和小慢说句话，进入对话页面">
        <span className="hero-figure">
          <Xiaoman mood={greeting ? "wave" : "smile"} width={480} className={greeting ? "hero-wave" : "hero-smile"}/>
        </span>
      </button>
      <button className="talk-btn" onClick={() => navigate("/chat")}><Mic size={23}/><span>和小慢说句话</span></button>
      <button className="anim-toggle" onClick={toggleAnim}>{animOn ? "让小慢安静站着" : "让小慢轻轻动起来"}</button>
    </section>
    <p className="home-footer">慢慢来，每一步都算数</p>
  </div>;
}

function CategoryPage({ category }: { category: CategoryKey }) {
  const navigate = useNavigate(); const data = categories[category];
  return <div className={`category-page page-enter tone-page-${data.tone}`}><header className="category-head"><button className="back-btn" onClick={() => navigate("/")} aria-label="返回首页"><ArrowLeft size={28}/></button><div><p>{data.note}</p><h1>{data.title}</h1><span>{data.intro}</span></div></header><main className="item-list">{data.items.map(({ label, desc, icon: Icon, href }, index) => <button className="item-card" key={label} onClick={() => href ? navigate(href) : toast(`「${label}」还在准备中，做好后就能用了。`)}><span className="item-index">{String(index + 1).padStart(2, "0")}</span><span className="item-icon"><Icon size={27}/></span><span className="item-copy"><strong>{label}</strong><small>{desc}</small></span><ChevronRight size={23} className="item-chevron"/></button>)}</main><footer className="category-footer"><span className="footer-buddy" aria-hidden="true"><Xiaoman mood="lively" width={200}/></span><span>慢慢看，记不住也没关系</span></footer></div>;
}

function ChatPage() {
  const navigate = useNavigate(); const [text, setText] = useState(""); const [messages, setMessages] = useState<string[]>([]); const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  const send = (event: FormEvent) => { event.preventDefault(); const value = text.trim(); if (!value) return; setMessages(m => [...m, value]); setText(""); window.setTimeout(() => toast("小慢的智能对话还没有接入，暂时不能回复您。"), 350); };
  return <div className="chat-page page-enter"><header className="chat-head"><button className="back-btn" onClick={() => navigate("/")} aria-label="返回首页"><ArrowLeft size={28}/></button><span className="chat-avatar character-avatar" aria-hidden="true"><Xiaoman mood="listen" width={200}/></span><div><h1>小慢</h1><p><span className="status-dot"/>学习中 · 对话尚未接入</p></div></header><main className="chat-body" ref={bodyRef}><div className="date-divider"><span>今天</span></div><div className="message-row"><span className="message-avatar character-avatar" aria-hidden="true"><Xiaoman mood="listen" width={200}/></span><div className="message bot">爷爷奶奶好，我是小慢。我还很小，智能对话还没有接上，现在还不能真正回答您说的话。等功能接入了，我就能陪您聊天啦。</div></div>{messages.map((message, index) => <div className="message user" key={`${message}-${index}`}>{message}</div>)}</main><form className="chat-input" onSubmit={send}><button type="button" className="mic-btn" onClick={() => toast("语音功能还在准备中，之后就能用语音和小慢说话。") } aria-label="语音输入（准备中）"><Mic size={25}/></button><input value={text} onChange={e => setText(e.target.value)} placeholder="想和小慢说的话……" aria-label="想和小慢说的话"/><button className="send-btn" type="submit" disabled={!text.trim()}><Send size={20}/><span>发送</span></button></form></div>;
}

export default function SlowLifeApp() {
  const location = useLocation(); const [bigText, setBigText] = useBigText();
  const content = useMemo(() => {
    const lessonMatch = /^\/wechat\/lesson\/([\w-]+)$/.exec(location.pathname);
    if (lessonMatch) return <WechatLessonPage key={lessonMatch[1]} lessonKey={lessonMatch[1]}/>;
    const lifeLessonMatch = /^\/life\/lesson\/([\w-]+)$/.exec(location.pathname);
    if (lifeLessonMatch) return <LifeLessonPage key={lifeLessonMatch[1]} lessonKey={lifeLessonMatch[1]}/>;
    if (location.pathname === "/life/contacts") return <ContactsPage/>;
    if (location.pathname === "/chat") return <ChatPage/>;
    if (location.pathname === "/fraud") return <FraudPage bigText={bigText} setBigText={setBigText}/>;
    const healthView = /^\/health(?:\/(medication|readings|visit))?\/?$/.exec(location.pathname);
    if (healthView) {
      const view = (healthView[1] ?? "overview") as "overview" | "medication" | "readings" | "visit";
      return <HealthPage key={view} view={view} bigText={bigText} setBigText={setBigText}/>;
    }
    const key = location.pathname.slice(1);
    if (key === "wechat" || key === "life") return <CategoryPage category={key}/>;
    return <HomePage bigText={bigText} setBigText={setBigText}/>;
  }, [location.pathname, bigText]);
  return <main className="app-shell"><div className="paper-grain" aria-hidden="true"/>{content}</main>;
}
