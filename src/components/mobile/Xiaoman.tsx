import type { CSSProperties } from "react";

export type XiaomanMood = "wave" | "smile" | "listen" | "lively";

const XIAOMAN_SOURCES: Record<XiaomanMood, string> = {
  wave: "https://b.ux-cdn.com/uxarts-agent/20261117/a3d255fb68894a6ebb34af6a78e2c2f1.png",
  smile: "https://b.ux-cdn.com/uxarts-agent/20261117/988ec9335fcd4a438b8a4fab363afa70.png",
  listen: "https://b.ux-cdn.com/uxarts-agent/20261117/d40765be38334eadb8f25c8105bfeca4.png",
  lively: "https://b.ux-cdn.com/uxarts-agent/20261117/0dd1a4d6a9a84b7b970b5d47ca5939f2.png"
};

export const xiaomanArt = (mood: XiaomanMood, width: number) => `${XIAOMAN_SOURCES[mood]}?imageView2/2/w/${width}/q/85/format/webp`;

export function Xiaoman({ mood, width, className = "", alt = "" }: { mood: XiaomanMood; width: number; className?: string; alt?: string }) {
  return <img className={className} src={xiaomanArt(mood, width)} width={width} height={Math.round(width * 16 / 9)} alt={alt}/>;
}

export function LeafSprig({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 120 90" aria-hidden="true"><path d="M18 78C45 58 65 37 101 13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M42 57C25 53 23 40 23 40s16-2 25 10M61 42C45 33 49 20 49 20s16 4 19 16M78 29C78 13 91 8 91 8s5 15-7 25" fill="currentColor" opacity=".65"/></svg>;
}
