import { useEffect, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { ArrowDown, SearchCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { checkFraudMessage, fraudSignalAdvice, type FraudSignal } from "@/lib/fraud-check";
import { FraudSpeechControls } from "@/components/mobile/FraudSpeech";

const example = "有人自称客服，说取消扣费要开屏幕共享，还让我把验证码发给他。";
const maxMessageLength = 500;
const checkWithSomeone = "涉及钱款、验证码或个人信息时，请用原来的号码找本人核实，或自己打开原平台的官方客服入口。";

export function FraudMessageCheck({ onHelp, onRead, onReset, playback }: {
  onHelp: () => void;
  onRead: (text: string, generalAdvice: string) => void;
  onReset: () => void;
  playback: ComponentProps<typeof FraudSpeechControls>["playback"];
}) {
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<FraudSignal[] | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const result = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (matches) result.current?.focus();
  }, [matches]);

  function changeText(value: string) {
    onReset();
    setText(value);
    setMatches(null);
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onReset();
    const message = text.trim();
    if (!message) {
      setError("请先粘贴消息，或用自己的话写下对方让您做什么。");
      input.current?.focus();
      return;
    }
    setError("");
    setMatches(checkFraudMessage(message));
  }

  return <section className="care-panel fraud-message" aria-labelledby="fraud-message-title">
    <header className="care-summary-heading">
      <span className="care-emblem"><SearchCheck size={23} aria-hidden="true"/></span>
      <h2 id="fraud-message-title">可疑消息快查</h2>
    </header>
    <form className="care-form" onSubmit={submit}>
      <label>粘贴消息，或写下对方让您做什么
        <textarea ref={input} rows={3} value={text} maxLength={maxMessageLength} autoComplete="off" spellCheck={false} aria-describedby="fraud-message-privacy"
          onPaste={(event) => {
            const selected = event.currentTarget.selectionEnd - event.currentTarget.selectionStart;
            if (text.length - selected + event.clipboardData.getData("text").length <= maxMessageLength) return;
            event.preventDefault();
            onReset();
            setMatches(null);
            setError("这段文字太长，请分段粘贴，先查对方让您操作的那一段。");
          }}
          onChange={(event) => changeText(event.target.value)}/>
      </label>
      <p className="care-note" id="fraud-message-privacy">文字只在本机检查。请去掉验证码和银行卡号。每次最多检查 500 字，长消息可分段。</p>
      {error && <p className="care-error" role="alert">{error}</p>}
      <div className="care-actions fraud-message-actions">
        <button className="care-button care-primary" type="submit">查找可疑线索</button>
        <button className="care-button" type="button" onClick={() => { changeText(example); input.current?.focus(); }}>试用示例</button>
        {text && <button className="care-text-button" type="button" onClick={() => { changeText(""); input.current?.focus(); }}>清空文字</button>}
      </div>
    </form>
    {matches && <div className="fraud-message-result">
      <h3 ref={result} tabIndex={-1}>{matches.length ? "先停下来，核实这几处" : "请先核实消息来源"}</h3>
      {matches.length > 0 && <ul className="care-records">
        {matches.map((id) => <li className="care-record" key={id}>
          <strong>{fraudSignalAdvice[id].label}</strong>
          <p className="care-note">{fraudSignalAdvice[id].action}</p>
        </li>)}
      </ul>}
      <p className="care-note">快查只识别常见字眼。{checkWithSomeone}</p>
      <div className="care-actions">
        <Link className="care-button" to="/life/contacts">找家人核实</Link>
        <button className="care-text-button" type="button" onClick={onHelp}>已经操作，查看求助步骤 <ArrowDown size={17} aria-hidden="true"/></button>
      </div>
      <FraudSpeechControls playback={playback} onRead={() => onRead([
        ...matches.map((id) => fraudSignalAdvice[id].action),
        checkWithSomeone,
      ].join(" "), checkWithSomeone)}/>
    </div>}
  </section>;
}
