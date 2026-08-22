import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Avatar } from "@/components/Avatar";
import { addContact, useContacts } from "@/lib/contacts-store";
import { findProfileByEmail } from "@/lib/chat-db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const contacts = useContacts();
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { user } = useAuth();
  const [chatEmail, setChatEmail] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const startChat = async () => {
    const value = chatEmail.trim().toLowerCase();
    if (!value) return;
    if (!user) { navigate({ to: "/login" }); return; }
    setLookupBusy(true);
    setLookupError(null);
    const found = await findProfileByEmail(value);
    setLookupBusy(false);
    if (!found) {
      setLookupError(lang === "hi" ? "इस ईमेल से कोई उपयोगकर्ता नहीं मिला" : "No ChatWave user with that email");
      return;
    }
    navigate({ to: "/chat/$id", params: { id: found.id } });
  };

  const labels = {
    title: lang === "hi" ? "संपर्क" : "Contacts",
    addContact: lang === "hi" ? "नया संपर्क" : "Add contact",
    name: lang === "hi" ? "नाम" : "Name",
    phone: lang === "hi" ? "फ़ोन नंबर" : "Phone number",
    save: lang === "hi" ? "सेव करें" : "Save",
    empty: lang === "hi" ? "कोई संपर्क नहीं" : "No contacts found",
    namePh: lang === "hi" ? "पूरा नाम" : "Full name",
    phonePh: "+91 98765 43210",
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s),
    );
  }, [q, contacts]);

  const submit = () => {
    if (!name.trim() || !phone.trim()) return;
    addContact({ name: name.trim(), phone: phone.trim() });
    setName("");
    setPhone("");
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
      <header
        className="px-3 py-3 flex items-center gap-3 sticky top-0 z-20"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/home" })} className="p-1.5 -ml-1 rounded-full hover:bg-white/10" aria-label="back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <div className="font-semibold text-lg leading-tight">{labels.title}</div>
          <div className="text-xs opacity-80">{contacts.length} {t("participants")}</div>
        </div>
      </header>

      <div className="px-3 py-2 bg-card sticky top-[60px] z-10 border-b border-border">
        <div className="bg-muted rounded-full flex items-center px-3 py-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="bg-transparent outline-none px-2 py-1 text-sm flex-1"
          />
        </div>
      </div>

      <div className="px-4 py-4 border-b border-border/60 bg-card/50">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          {lang === "hi" ? "ईमेल से चैट शुरू करें" : "Start a chat by email"}
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={chatEmail}
            onChange={(e) => setChatEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void startChat()}
            placeholder="friend@example.com"
            className="flex-1 px-3 py-2 rounded-lg bg-input border border-border outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          <button
            onClick={() => void startChat()}
            disabled={lookupBusy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 press"
            style={{ background: "var(--color-primary)" }}
          >
            {lookupBusy ? "…" : lang === "hi" ? "चैट" : "Chat"}
          </button>
        </div>
        {lookupError && <p role="alert" className="mt-2 text-xs text-destructive">{lookupError}</p>}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 border-b border-border/60"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"/><path d="M3 21v-1a6 6 0 0 1 6-6h2"/><path d="M19 16v6M16 19h6"/></svg>
        </div>
        <span className="font-semibold">{labels.addContact}</span>
      </button>

      <ul className="flex-1">
        {filtered.length === 0 && (
          <li className="text-center text-sm text-muted-foreground py-12">{labels.empty}</li>
        )}
        {filtered.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
            <Avatar name={c.name} hue={c.avatarHue} size={48} online={c.online} />
            <div className="flex-1 min-w-0 border-b border-border/60 pb-3 -mb-3">
              <div className="font-semibold truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground truncate">{c.about}</div>
              <div className="text-xs text-muted-foreground truncate">{c.phone}</div>
            </div>
          </li>
        ))}
      </ul>

      {showAdd && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowAdd(false)}>
          <div
            className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 animate-[sheet-up_.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold text-lg mb-4">{labels.addContact}</div>
            <label className="block text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">{labels.name}</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={labels.namePh}
              className="w-full border-b border-border focus:border-primary outline-none py-2 mb-4 bg-transparent"
            />
            <label className="block text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">{labels.phone}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={labels.phonePh}
              type="tel"
              className="w-full border-b border-border focus:border-primary outline-none py-2 mb-6 bg-transparent"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted">
                {t("cancel")}
              </button>
              <button
                onClick={submit}
                disabled={!name.trim() || !phone.trim()}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {labels.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
