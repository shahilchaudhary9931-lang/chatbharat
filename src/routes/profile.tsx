import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const { t, lang, setLang } = useI18n();
  const { dark, setDark } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState("You");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [editName, setEditName] = useState(false);

  useEffect(() => {
    setPhone(localStorage.getItem("cw_phone") || "");
    const u = localStorage.getItem("cw_user");
    if (u) {
      try { const o = JSON.parse(u); if (o.name) setName(o.name); } catch {}
    }
    setAbout(localStorage.getItem("cw_about") || t("aboutDefault"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveName = () => {
    setEditName(false);
    localStorage.setItem("cw_user", JSON.stringify({ name, phone }));
  };

  const logout = () => {
    localStorage.removeItem("cw_user");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header
        className="px-3 py-3 flex items-center gap-3"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/home" })} className="p-1.5 -ml-1 rounded-full hover:bg-white/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="font-semibold text-lg">{t("settings")}</div>
      </header>

      {/* Avatar */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="relative">
          <Avatar name={name} hue={170} size={120} />
          <button
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
            style={{ background: "var(--color-primary)" }}
            aria-label="change photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 19V8a2 2 0 0 0-2-2h-3.2l-1.4-2H7.6L6.2 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2Z"/><circle cx="12" cy="13" r="4" fill="var(--color-primary)"/></svg>
          </button>
        </div>
      </div>

      {/* Fields */}
      <section className="px-4 space-y-1">
        <Row icon="👤" label={t("yourName")}>
          {editName ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="flex-1 bg-transparent border-b border-primary outline-none py-1"
              />
            </div>
          ) : (
            <button onClick={() => setEditName(true)} className="text-left w-full">
              <div className="text-base">{name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Tap to edit</div>
            </button>
          )}
        </Row>

        <Row icon="ℹ️" label={t("about")}>
          <input
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            onBlur={() => localStorage.setItem("cw_about", about)}
            className="w-full bg-transparent outline-none text-base"
          />
        </Row>

        <Row icon="📱" label="Phone">
          <div className="text-base">+91 {phone || "—"}</div>
        </Row>
      </section>

      <div className="h-3" />

      {/* Toggles */}
      <section className="px-4 space-y-1">
        <Row icon="🌙" label={t("darkMode")}>
          <Switch checked={dark} onChange={setDark} />
        </Row>

        <Row icon="🌐" label={t("language")}>
          <div className="flex gap-2">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full text-sm border ${lang === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
            >
              English
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`px-3 py-1 rounded-full text-sm border ${lang === "hi" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
            >
              हिंदी
            </button>
          </div>
        </Row>

        <Row icon="🔔" label={t("notifications")}>
          <Switch checked onChange={() => {}} />
        </Row>

        <Row icon="🔒" label={t("privacy")}>
          <span className="text-muted-foreground text-sm">›</span>
        </Row>

        <Row icon="❓" label={t("help")}>
          <span className="text-muted-foreground text-sm">›</span>
        </Row>
      </section>

      <div className="px-4 mt-8">
        <button
          onClick={logout}
          className="w-full py-3 rounded-full border border-destructive text-destructive font-semibold text-sm hover:bg-destructive/5"
        >
          {t("logout")}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-6">{t("appName")} · v1.0</p>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border/60">
      <span className="text-xl pt-0.5" aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{label}</div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-12 h-6 rounded-full transition-colors"
      style={{ background: checked ? "var(--color-primary)" : "var(--color-border)" }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(24px)" : "translateX(0)" }}
      />
    </button>
  );
}
