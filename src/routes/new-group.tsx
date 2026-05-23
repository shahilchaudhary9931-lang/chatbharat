import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { contacts } from "@/lib/mock-data";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/new-group")({
  component: NewGroup,
});

function NewGroup() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className="px-3 py-3 flex items-center gap-3"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => (step === 2 ? setStep(1) : navigate({ to: "/home" }))} className="p-1.5 -ml-1 rounded-full hover:bg-white/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <div className="font-semibold">{step === 1 ? t("newGroup") : t("createGroup")}</div>
          <div className="text-xs opacity-85">
            {step === 1
              ? `${t("selectContacts")} · ${selected.length}/${contacts.length}`
              : `${selected.length + 1} ${t("participants")}`}
          </div>
        </div>
      </header>

      {step === 1 && (
        <>
          <div className="px-4 py-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full px-4 py-2 rounded-full bg-input border border-border outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          {selected.length > 0 && (
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
              {selected.map((id) => {
                const c = contacts.find((x) => x.id === id)!;
                return (
                  <div key={id} className="flex flex-col items-center gap-1 shrink-0 relative">
                    <button onClick={() => toggle(id)} className="relative">
                      <Avatar name={c.name} hue={c.avatarHue} size={48} />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center">×</span>
                    </button>
                    <span className="text-xs max-w-16 truncate">{c.name.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          )}

          <ul className="flex-1 overflow-y-auto">
            {filtered.map((c) => (
              <li key={c.id}>
                <button onClick={() => toggle(c.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 text-left">
                  <Avatar name={c.name} hue={c.avatarHue} size={48} online={c.online} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.about}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected.includes(c.id) ? "bg-primary border-primary" : "border-border"}`}>
                    {selected.includes(c.id) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {selected.length > 0 && (
            <button
              onClick={() => setStep(2)}
              className="fixed bottom-6 right-[calc(50%-13rem+1.5rem)] w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center text-white"
              style={{ background: "var(--color-primary)" }}
              aria-label="next"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          )}
        </>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col px-6 pt-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl" style={{ background: "var(--color-muted)" }}>
              👥
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groupName")}
              className="flex-1 border-b border-primary py-2 bg-transparent outline-none text-lg"
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              {selected.length} {t("participants")}
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.map((id) => {
                const c = contacts.find((x) => x.id === id)!;
                return (
                  <span key={id} className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1">
                    <Avatar name={c.name} hue={c.avatarHue} size={26} />
                    <span className="text-sm">{c.name.split(" ")[0]}</span>
                  </span>
                );
              })}
            </div>
          </div>

          <button
            disabled={!name.trim()}
            onClick={() => navigate({ to: "/home" })}
            className="mt-auto mb-4 w-14 h-14 self-end rounded-2xl shadow-lg flex items-center justify-center text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
            aria-label="create"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
