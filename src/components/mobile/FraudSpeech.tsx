import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type Target = "scenario" | "check";
type Playback = { target: Target; playing: boolean; message: string };
type Active = { target: Target; utterance: SpeechSynthesisUtterance };

export function useFraudSpeech() {
  const active = useRef<Active | null>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);

  useEffect(() => () => {
    if (!active.current) return;
    active.current = null;
    window.speechSynthesis?.cancel();
  }, []);

  function stop() {
    if (active.current) {
      active.current = null;
      window.speechSynthesis?.cancel();
    }
    setPlayback(null);
  }

  function toggle(target: Target, text: string, generalAdvice = text) {
    const stopping = active.current?.target === target;
    stop();
    if (stopping) {
      setPlayback({ target, playing: false, message: "已停止朗读。" });
      return;
    }

    const speech = window.speechSynthesis;
    const unavailable = "暂时无法朗读，可以继续看文字。";
    if (!speech || !window.SpeechSynthesisUtterance) {
      setPlayback({ target, playing: false, message: unavailable });
      return;
    }
    const localVoice = speech.getVoices?.().find((voice) => voice.localService && /^zh(?:[-_](?:CN|Hans)(?:[-_]|$)|$)/i.test(voice.lang));
    const hasDetailedAudio = Boolean(localVoice) || generalAdvice === text;
    const utterance = new SpeechSynthesisUtterance(hasDetailedAudio ? text : generalAdvice);
    utterance.lang = "zh-CN";
    utterance.rate = 0.83;
    if (localVoice) utterance.voice = localVoice;
    function finish(message: string) {
      if (active.current?.utterance !== utterance) return;
      active.current = null;
      setPlayback({ target, playing: false, message });
    }
    utterance.onend = () => finish("已读完。");
    utterance.onerror = ({ error }) => finish(error === "canceled" || error === "interrupted" ? "已停止朗读。" : unavailable);
    active.current = { target, utterance };
    setPlayback({ target, playing: true, message: hasDetailedAudio ? "正在朗读这条提醒。" : "正在朗读通用核实提示。具体线索可看上方文字。" });
    try { speech.speak(utterance); }
    catch { finish(unavailable); }
  }

  return { playback, stop, toggle };
}

export function FraudSpeechControls({ playback, onRead }: { playback?: Playback; onRead: () => void }) {
  return <div className="fraud-speech">
    <button className="care-button" type="button" onClick={onRead}>
      {playback?.playing ? <VolumeX size={20} aria-hidden="true"/> : <Volume2 size={20} aria-hidden="true"/>}
      {playback?.playing ? "停止朗读" : "听一遍"}
    </button>
    <p className="care-status" role="status">{playback?.message}</p>
  </div>;
}
