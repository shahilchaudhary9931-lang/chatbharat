import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate({ to: session ? "/home" : "/login" });
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigate, session, loading]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-between py-16 px-6"
      style={{ background: "linear-gradient(180deg, var(--color-header), color-mix(in oklab, var(--color-header) 80%, black))" }}
    >
      <div />
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full pulse-ring" />
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-primary-foreground)" }}
          >
            <svg viewBox="0 0 24 24" width="58" height="58" fill="none">
              <path
                d="M12 2C6.48 2 2 6.21 2 11.4c0 1.85.6 3.57 1.62 5.02L2 22l5.78-1.52A10.5 10.5 0 0 0 12 20.8c5.52 0 10-4.21 10-9.4S17.52 2 12 2Z"
                fill="var(--color-header)"
              />
              <path
                d="M9 9c0-.55.45-1 1-1s1 .45 1 1c0 1 2 3 3 3s1 .45 1 1-.45 1-1 1c-2 0-5-3-5-5Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--color-header-foreground)" }}>
          {t("appName")}
        </h1>
        <p className="text-sm opacity-80" style={{ color: "var(--color-header-foreground)" }}>
          {t("tagline")}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs opacity-70" style={{ color: "var(--color-header-foreground)" }}>
          {t("from")} <span className="font-semibold">ChatWave Labs</span>
        </p>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 rounded-full ${lang === "en" ? "bg-white/20" : "opacity-60"}`}
            style={{ color: "var(--color-header-foreground)" }}
          >
            English
          </button>
          <button
            onClick={() => setLang("hi")}
            className={`px-3 py-1 rounded-full ${lang === "hi" ? "bg-white/20" : "opacity-60"}`}
            style={{ color: "var(--color-header-foreground)" }}
          >
            हिंदी
          </button>
        </div>
      </div>
    </div>
  );
}
