import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { lang, setLang } = useI18n();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home" });
  }, [loading, session, navigate]);

  const L = {
    title: lang === "hi" ? "अपना ईमेल डालें" : "Enter your email",
    help:
      lang === "hi"
        ? "हम आपको एक 6-अंकों का कोड और मैजिक लिंक भेजेंगे।"
        : "We'll email you a 6-digit code and a magic link.",
    email: lang === "hi" ? "ईमेल" : "Email",
    next: lang === "hi" ? "कोड भेजें" : "Send code",
    sending: lang === "hi" ? "भेजा जा रहा है…" : "Sending…",
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(lang === "hi" ? "मान्य ईमेल डालें" : "Enter a valid email address");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: value,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    localStorage.setItem("cw_email", value);
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
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{L.help}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 flex-1">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{L.email}</label>
          <input
            type="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-lg"
          />
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground">
          By continuing you agree to ChatWave's <span className="text-primary">Terms</span> & <span className="text-primary">Privacy Policy</span>.
        </p>

        <div className="mt-auto flex flex-col gap-3">
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base press disabled:opacity-60"
          >
            {busy ? L.sending : L.next}
          </button>

          <Link to="/home" className="text-center text-xs text-muted-foreground">
            Browse demo chats →
          </Link>
        </div>
      </form>
    </div>
  );
}
