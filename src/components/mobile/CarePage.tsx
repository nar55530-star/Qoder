import { ArrowLeft, Type } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./care.css";

export type CareTextProps = { bigText: boolean; setBigText: (value: boolean) => void };

export default function CarePage({ title, description, tone, backTo = "/", bigText, setBigText, children }: CareTextProps & {
  title: string;
  description: string;
  tone: "purple" | "teal";
  backTo?: string;
  children: ReactNode;
}) {
  return (
    <div className={`category-page care-page page-enter tone-page-${tone}`}>
      <header className="category-head care-head">
        <div className="care-topline">
          <Link className="back-btn" to={backTo} aria-label={backTo === "/" ? "返回首页" : "返回健康管理"}>
            <ArrowLeft size={25} aria-hidden="true"/>
          </Link>
          <button type="button" className={`bigtext-btn ${bigText ? "is-on" : ""}`}
            aria-pressed={bigText} onClick={() => setBigText(!bigText)}>
            <Type size={20} aria-hidden="true"/>{bigText ? "已开大字" : "大字"}
          </button>
        </div>
        <h1>{title}</h1>
        <p className="care-description">{description}</p>
      </header>
      <div className="care-content">{children}</div>
    </div>
  );
}
