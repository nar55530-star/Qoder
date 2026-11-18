import { type ReactNode } from "react";
import { Camera, Plus, PhoneOff } from "lucide-react";
import LessonSteps from "@/components/mobile/LessonSteps";

type WxItem =
  | { k: "row"; label: string; hi?: boolean }
  | { k: "chat"; side: "them" | "me"; text: string; hi?: boolean }
  | { k: "red"; side?: "them" | "me"; hi?: boolean }
  | { k: "redOpen"; hi?: boolean }
  | { k: "redDone" }
  | { k: "btn"; label: string; hi?: boolean }
  | { k: "input"; placeholder: string; value?: string; hi?: boolean }
  | { k: "dots"; hi?: boolean }
  | { k: "menu"; items: string[]; hi?: string }
  | { k: "photos"; hi?: boolean }
  | { k: "pin" }
  | { k: "paycode" }
  | { k: "call" }
  | { k: "post"; name: string; text: string; liked?: boolean }
  | { k: "note"; text: string };

type Step = {
  title: string;
  text: string;
  wxTitle: string;
  items: WxItem[];
  tabHi?: "微信" | "通讯录" | "发现" | "我";
  cameraHi?: boolean;
  plusHi?: boolean;
  hiText?: string;
};

type Lesson = { key: string; title: string; steps: Step[]; tip: string; fraud?: string };

export const wechatLessons: Lesson[] = [
  {
    key: "moments",
    title: "发朋友圈",
    tip: "发错了也不怕：点自己那条朋友圈，再点「删除」就没有了。",
    steps: [
      {
        title: "点最下面一排的「发现」",
        text: "打开微信后，看屏幕最下面一排小字，找到「发现」，点一下。",
        wxTitle: "微信",
        tabHi: "发现",
        items: [
          { k: "chat", side: "them", text: "女儿：妈，晚饭吃了吗？" },
          { k: "chat", side: "me", text: "吃啦，红烧排骨" },
          { k: "chat", side: "them", text: "老姐妹：明天公园见" }
        ],
        hiText: "「发现」在最下面一排，点它"
      },
      {
        title: "点最上面的「朋友圈」",
        text: "「发现」这一页里，最上面第一个就是「朋友圈」，点进去。",
        wxTitle: "发现",
        tabHi: "发现",
        items: [
          { k: "row", label: "朋友圈", hi: true },
          { k: "row", label: "视频号" },
          { k: "row", label: "扫一扫" },
          { k: "row", label: "摇一摇" }
        ]
      },
      {
        title: "点右上角的小相机",
        text: "想配照片发，就点一下右上角的小相机；只想发字不配照片，就按住它不放（长按）。",
        wxTitle: "朋友圈",
        cameraHi: true,
        items: [
          { k: "post", name: "女儿", text: "今天带豆豆去公园啦，天气特别好～" },
          { k: "post", name: "老姐妹", text: "广场舞比赛拿了第二名！" }
        ]
      },
      {
        title: "选照片，写一句话",
        text: "先点一下照片格子选照片（选中的角上会有小勾），再在上面空格子里写一句话。",
        wxTitle: "发表",
        items: [
          { k: "photos", hi: true },
          { k: "input", placeholder: "这一刻的想法…" }
        ]
      },
      {
        title: "点绿色的「发表」",
        text: "写好了，点右上角绿色的「发表」，朋友圈就发出去了。",
        wxTitle: "发表",
        items: [
          { k: "input", placeholder: "这一刻的想法…", value: "今天天气真好" },
          { k: "btn", label: "发表", hi: true }
        ]
      }
    ]
  },
  {
    key: "like",
    title: "点赞和评论",
    tip: "点赞不花钱，想取消就再点一下那个黄色的赞。",
    steps: [
      {
        title: "找到想看的内容",
        text: "进了朋友圈，慢慢往下滑，看到喜欢的内容停下来。",
        wxTitle: "朋友圈",
        items: [
          { k: "post", name: "女儿", text: "豆豆会背古诗啦！" },
          { k: "post", name: "老姐妹", text: "今天的早餐，简简单单" }
        ]
      },
      {
        title: "点右下角的两个点",
        text: "在内容右下角有两个小点「···」，点它一下，会弹出小菜单。",
        wxTitle: "朋友圈",
        items: [
          { k: "post", name: "女儿", text: "豆豆会背古诗啦！" },
          { k: "dots", hi: true }
        ]
      },
      {
        title: "点「赞」或「评论」",
        text: "点「赞」，就点了；点「评论」可以写字，写完点绿色的「发送」。",
        wxTitle: "朋友圈",
        items: [
          { k: "post", name: "女儿", text: "豆豆会背古诗啦！" },
          { k: "menu", items: ["赞", "评论"], hi: "赞" }
        ]
      },
      {
        title: "点赞就变黄啦",
        text: "点过赞之后，那个小赞会变成黄色，对方也能看到您点了赞。",
        wxTitle: "朋友圈",
        items: [
          { k: "post", name: "女儿", text: "豆豆会背古诗啦！", liked: true },
          { k: "note", text: "黄色的小赞 = 已经点过啦" }
        ]
      }
    ]
  },
  {
    key: "video",
    title: "视频聊天",
    tip: "连着 WiFi 或家里宽带视频不花钱；对方没接，可能在忙，过会儿再打。",
    steps: [
      {
        title: "找到要找的人",
        text: "打开微信，在聊天列表里找到想视频的人，点开那个聊天。",
        wxTitle: "微信",
        items: [
          { k: "chat", side: "them", text: "女儿：妈，晚饭吃了吗？" },
          { k: "chat", side: "me", text: "吃啦" },
          { k: "row", label: "女儿", hi: true }
        ],
        hiText: "点这个聊天"
      },
      {
        title: "点右下角的「＋」",
        text: "进了聊天以后，看右下角有个「＋」号，点一下，会弹出好多功能。",
        wxTitle: "女儿",
        plusHi: true,
        items: [
          { k: "chat", side: "them", text: "妈，想豆豆了吗？" },
          { k: "chat", side: "me", text: "想啦，视频一个？" }
        ]
      },
      {
        title: "点「视频通话」",
        text: "弹出的小面板里有「视频通话」，点它，等对方接听就能面对面说话。",
        wxTitle: "女儿",
        items: [
          { k: "menu", items: ["视频通话", "语音通话"], hi: "视频通话" }
        ]
      },
      {
        title: "聊完，点红色电话挂断",
        text: "看到对方后想聊多久都行；聊完了，点那个红色的电话图标，就挂断了。",
        wxTitle: "视频通话 · 女儿",
        items: [{ k: "call" }]
      }
    ]
  },
  {
    key: "pay",
    title: "微信付款",
    tip: "付多少钱由收银员输入，您只要把条形码给对方扫就行。",
    fraud: "付款之前看清金额。别人让您扫他递来的二维码、报验证码、点短信链接，都不要做。",
    steps: [
      {
        title: "点「我」，再点「服务」",
        text: "点最下面一排的「我」，再点「服务」。（旧版本的微信里，这里叫「支付」，位置一样。）",
        wxTitle: "我",
        tabHi: "我",
        items: [
          { k: "row", label: "服务", hi: true },
          { k: "row", label: "收藏" },
          { k: "row", label: "朋友圈" }
        ]
      },
      {
        title: "点「收付款」",
        text: "「服务」这一页里，最上面就是「收付款」，点它。",
        wxTitle: "服务",
        items: [
          { k: "row", label: "收付款", hi: true },
          { k: "row", label: "生活缴费" },
          { k: "row", label: "钱包" }
        ]
      },
      {
        title: "把条形码给收银员扫",
        text: "屏幕上会出现一个条形码，把手机递给收银员，让他扫一下就行。",
        wxTitle: "收付款",
        items: [{ k: "paycode" }]
      },
      {
        title: "金额由收银员输入",
        text: "您不用输多少钱——买多少钱的东西，收银员那边会输入。屏幕上出现金额时，看一眼是不是您买的东西的价钱。",
        wxTitle: "收付款",
        items: [{ k: "paycode" }, { k: "note", text: "屏幕上出现金额时，核对一下再让扫" }]
      }
    ]
  },
  {
    key: "giftIn",
    title: "领红包",
    tip: "真正的红包不需要任何密码就能领。",
    fraud: "让您「先转 100 领 500」的，都是骗子，直接删掉。",
    steps: [
      {
        title: "聊天里看到红色小方块",
        text: "别人发的红包，在聊天里是一块红色的小卡片，点它。",
        wxTitle: "老姐妹",
        items: [
          { k: "chat", side: "them", text: "中秋快乐！" },
          { k: "red", hi: true }
        ]
      },
      {
        title: "点中间的「开」",
        text: "点开后是一个大红包，再点中间圆圈的「开」，红包就领到了。",
        wxTitle: "微信红包",
        items: [{ k: "redOpen", hi: true }]
      },
      {
        title: "钱自动进了零钱",
        text: "领到的钱自动放进「零钱」里，不用再做别的，也不会丢。",
        wxTitle: "微信红包",
        items: [{ k: "redDone" }, { k: "note", text: "钱已经放进「零钱」啦" }]
      }
    ]
  },
  {
    key: "giftOut",
    title: "发红包",
    tip: "红包只发给认识的家人朋友。",
    fraud: "「做任务返现」「先垫钱再返利」都是骗局，一分钱也不要转。",
    steps: [
      {
        title: "点开和家人的聊天",
        text: "先找到要发红包给谁，点开和那个人的聊天。",
        wxTitle: "微信",
        items: [{ k: "row", label: "女儿", hi: true }]
      },
      {
        title: "点「＋」，选「红包」",
        text: "点右下角「＋」号，弹出的小面板里选「红包」。",
        wxTitle: "女儿",
        plusHi: true,
        items: [
          { k: "chat", side: "them", text: "妈，节日快乐！" },
          { k: "menu", items: ["红包", "转账"], hi: "红包" }
        ]
      },
      {
        title: "填金额，点「塞钱进红包」",
        text: "写上想发的金额（比如 8.88 元），点「塞钱进红包」，会弹出支付密码，输您设置的 6 位密码就发出去了。",
        wxTitle: "红包",
        items: [
          { k: "input", placeholder: "金额", value: "8.88", hi: true },
          { k: "btn", label: "塞钱进红包" },
          { k: "pin" }
        ]
      },
      {
        title: "家人就能领了",
        text: "红包出现在聊天里，对方点一下「开」就能领到。",
        wxTitle: "女儿",
        items: [
          { k: "chat", side: "me", text: "给豆豆买糖吃 🧧" },
          { k: "red" },
          { k: "chat", side: "them", text: "收到啦，谢谢妈！" }
        ]
      }
    ]
  }
];

const wxTabs: ("微信" | "通讯录" | "发现" | "我")[] = ["微信", "通讯录", "发现", "我"];

function Hi({ children }: { children: ReactNode }) {
  return <span className="wx-hi"><span className="wx-hi-tag">点这里</span>{children}</span>;
}

function WxWindow({ step }: { step: Step }) {
  return (
    <div className="wx" aria-hidden="true">
      <div className="wx-head">
        <span className="wx-back">‹</span>
        <span className="wx-title">{step.wxTitle}</span>
        {step.cameraHi ? <Hi><Camera className="wx-camera" size={18}/></Hi> : null}
      </div>
      <div className="wx-body">{step.items.map((item, i) => <WxItemView key={i} item={item} />)}</div>
      {step.tabHi
        ? <div className="wx-tabs">{wxTabs.map(t => t === step.tabHi
          ? <Hi key={t}><span className="wx-tab is-on">{t}</span></Hi>
          : <span key={t} className="wx-tab">{t}</span>)}</div>
        : null}
      {step.plusHi
        ? <Hi><span className="wx-plus"><Plus size={16} /></span></Hi>
        : null}
    </div>
  );
}

function WxItemView({ item }: { item: WxItem }) {
  switch (item.k) {
    case "row":
      return item.hi
        ? <Hi><span className="wx-row">{item.label}<span className="wx-chev">›</span></span></Hi>
        : <span className="wx-row">{item.label}<span className="wx-chev">›</span></span>;
    case "chat":
      return <span className={`wx-chat ${item.side === "me" ? "wx-chat-me" : ""}`}>
        {item.side === "them" ? <span className="wx-chat-face" /> : null}
        {item.hi ? <Hi><span className="wx-bubble">{item.text}</span></Hi> : <span className="wx-bubble">{item.text}</span>}
      </span>;
    case "red":
      return <span className={`wx-chat ${item.side === "me" ? "wx-chat-me" : ""}`}>
        {item.side === "me" ? null : <span className="wx-chat-face" />}
        {item.hi
          ? <Hi><span className="wx-red"><span className="wx-red-circle">開</span><span className="wx-red-text">微信红包</span><small>点击拆开</small></span></Hi>
          : <span className="wx-red"><span className="wx-red-circle">開</span><span className="wx-red-text">微信红包</span><small>点击拆开</small></span>}
      </span>;
    case "redOpen":
      return <Hi><span className="wx-red-open"><span className="wx-red-big">開</span><span>恭喜发财 大吉大利</span></span></Hi>;
    case "redDone":
      return <span className="wx-red-done"><span>已存入零钱</span><strong>¥ 8.88</strong></span>;
    case "btn":
      return item.hi
        ? <Hi><span className="wx-btn">{item.label}</span></Hi>
        : <span className="wx-btn">{item.label}</span>;
    case "input":
      return item.hi
        ? <Hi><span className="wx-input">{item.value || item.placeholder}</span></Hi>
        : <span className="wx-input">{item.value || item.placeholder}</span>;
    case "dots":
      return <Hi><span className="wx-dots">···</span></Hi>;
    case "menu":
      return <span className="wx-menu">{item.items.map(label => (
        item.hi === label
          ? <Hi key={label}><span className="wx-menu-item">{label}</span></Hi>
          : <span className="wx-menu-item" key={label}>{label}</span>
      ))}</span>;
    case "photos":
      return <Hi><span className="wx-photos">{[0, 1, 2, 3, 4, 5].map(n => <span key={n} className="wx-photo" />)}</span></Hi>;
    case "pin":
      return <span className="wx-pin"><span>支付密码</span>{[0, 1, 2, 3, 4, 5].map(n => <i key={n} />)}</span>;
    case "paycode":
      return <span className="wx-paycode"><span className="wx-paycode-bars" /><span>向商家付款</span></span>;
    case "call":
      return <span className="wx-call"><span className="wx-call-face" /><span>女儿</span><small>等待接听…</small><Hi><span className="wx-call-end"><PhoneOff size={22} /></span></Hi></span>;
    case "post":
      return <span className="wx-post">
        <span className="wx-post-face" />
        <span className="wx-post-copy"><span className="wx-post-name">{item.name}</span><span className="wx-post-text">{item.text}</span><span className={`wx-post-like ${item.liked ? "is-liked" : ""}`}>{item.liked ? "♥ 赞" : "···"}</span></span>
      </span>;
    case "note":
      return <span className="wx-little">{item.text}</span>;
  }
}

export default function WechatLessonPage({ lessonKey }: { lessonKey: string }) {
  const lesson = wechatLessons.find(l => l.key === lessonKey);
  if (!lesson) return <LessonSteps tone="green" storageKey={`mm-lesson-${lessonKey}`} backTo="/wechat" lesson={{ title: "课程还在准备中", steps: [{ title: "这节课还没做好", text: "做好后就能学了，先看看别的吧。" }] }}/>;
  return <LessonSteps
    tone="green"
    storageKey={`mm-lesson-${lesson.key}`}
    backTo="/wechat"
    mockNote="微信界面 · 简化示意图（不是真实截图）"
    lesson={{
      title: lesson.title,
      tip: lesson.tip,
      fraud: lesson.fraud,
      steps: lesson.steps.map(s => ({ title: s.title, text: s.text, hint: s.hiText, mock: <WxWindow step={s}/> }))
    }}
  />;
}
