import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Phone, Trash2, UserRoundPlus } from "lucide-react";

type Contact = { name: string; phone: string };

function loadContacts(): Contact[] {
  try {
    const raw = JSON.parse(localStorage.getItem("mm-contacts") || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((c): c is Contact => c && typeof c.name === "string" && typeof c.phone === "string");
  } catch { return []; }
}

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const persist = (next: Contact[]) => { setContacts(next); localStorage.setItem("mm-contacts", JSON.stringify(next)); };

  const add = (event: FormEvent) => {
    event.preventDefault();
    const n = name.trim();
    const p = phone.trim();
    if (!n) { toast("先填上家人的称呼，比如「女儿」「老伴」。"); return; }
    if (!/^[\d\s+\-()]{5,20}$/.test(p)) { toast("电话号码看起来不太对，请再核对一下（只要数字）。"); return; }
    if (contacts.some(c => c.name === n)) { toast(`「${n}」已经在电话本里啦。`); return; }
    persist([...contacts, { name: n, phone: p }]);
    setName(""); setPhone("");
    toast(`存好啦，想打给「${n}」点一下就行。`);
  };

  const remove = (target: Contact) => {
    if (!window.confirm(`确定删除「${target.name}」的电话吗？`)) return;
    persist(contacts.filter(c => c.name !== target.name));
    toast(`已删除「${target.name}」。`);
  };

  return (
    <div className="category-page page-enter tone-page-orange">
      <header className="category-head">
        <button className="back-btn" onClick={() => navigate("/life")} aria-label="返回生活小帮手"><ArrowLeft size={28}/></button>
        <div><p>想打就打</p><h1>联系家人</h1><span>把家人的电话存在这里，点一下就能打。</span></div>
      </header>

      <main className="contact-list">
        {contacts.length === 0
          ? <p className="contact-empty">电话本还是空的。<br/>在下面把家人的称呼和电话填上，存一次就一直在了。</p>
          : contacts.map(c => (
            <div className="contact-card" key={c.name}>
              <span className="contact-copy"><span className="contact-name">{c.name}</span><span className="contact-phone">{c.phone}</span></span>
              <a className="contact-call" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}><Phone size={22}/><span>拨打</span></a>
              <button className="contact-del" onClick={() => remove(c)} aria-label={`删除${c.name}的电话`}><Trash2 size={17}/><span>删除</span></button>
            </div>
          ))}
      </main>

      <form className="contact-add" onSubmit={add}>
        <p className="contact-add-title"><UserRoundPlus size={20}/>存一个新电话</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="称呼，比如：女儿" aria-label="家人称呼" autoComplete="off"/>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="电话号码" aria-label="电话号码" inputMode="tel" autoComplete="off"/>
        <button className="talk-btn" type="submit">存进电话本</button>
      </form>
      <p className="contact-note">在手机上点「拨打」，会用您手机自带的电话功能打出去；电脑浏览器可能不会拨号，建议用手机打开本页。</p>
    </div>
  );
}
