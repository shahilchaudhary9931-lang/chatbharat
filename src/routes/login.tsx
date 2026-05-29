import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) return;
    localStorage.setItem("cw_phone", phone);
    navigate({ to: "/otp" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8">
      <div className="flex justify-end gap-2 text-xs mb-6">
        <button onClick={() => setLang("en")} className={`px-3 py-1 rounded-full border ${lang === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>EN</button>
        <button onClick={() => setLang("hi")} className={`px-3 py-1 rounded-full border ${lang === "hi" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>हिं</button>
      </div>

      <div className="mb-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--color-primary)" }}>
          <svg viewBox="0 0 24 24" width="34" height="34" fill="white">
            <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">{t("enterPhone")}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t("phoneHelp")}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 flex-1">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("appName")}</label>
          <div className="flex gap-2 mt-2">
            <div className="flex items-center px-3 rounded-lg bg-input border border-border font-semibold">+91</div>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="flex-1 px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-lg tracking-wider"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          By continuing you agree to ChatWave's <span className="text-primary">Terms</span> & <span className="text-primary">Privacy Policy</span>.
        </p>

        <div className="mt-auto flex flex-col gap-3">
          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base press"
          >
            {t("next")}
          </button>

          <Link to="/home" className="text-center text-xs text-muted-foreground">
            Skip for demo →
          </Link>
        </div>
      </form>
    </div>
  );
}
