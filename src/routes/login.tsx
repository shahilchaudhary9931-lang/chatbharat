import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | ChatWave" },
      { name: "description", content: "Log in or sign up to ChatWave with your email and password." },
      { property: "og:title", content: "Login | ChatWave" },
      { property: "og:description", content: "Log in or sign up to ChatWave with your email and password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

type Mode = "login" | "signup";

function Login() {
  const { lang, setLang } = useI18n();
  const hi = lang === "hi";
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home" });
  }, [loading, session, navigate]);

  const L = {
    title: mode === "login" ? (hi ? "लॉगिन करें" : "Welcome back") : hi ? "खाता बनाएँ" : "Create account",
    help: hi ? "अपना ईमेल और पासवर्ड डालें।" : "Enter your email and password.",
    email: hi ? "ईमेल" : "Email",
    password: hi ? "पासवर्ड" : "Password",
    submit: mode === "login" ? (hi ? "लॉगिन" : "Log in") : hi ? "साइन अप" : "Sign up",
    wait: hi ? "कृपया रुकें…" : "Please wait…",
    switchTo: mode === "login" ? (hi ? "नया खाता? साइन अप करें" : "New here? Sign up") : hi ? "पहले से खाता है? लॉगिन करें" : "Have an account? Log in",
    forgot: hi ? "पासवर्ड भूल गए?" : "Forgot password?",
  };

  const valid = () => {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError(hi ? "मान्य ईमेल डालें" : "Enter a valid email address");
      return null;
    }
    return v;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const value = valid();
    if (!value) return;
    if (password.length < 6) {
      setError(hi ? "पासवर्ड कम से कम 6 अक्षर का हो" : "Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email: value, password });
      setBusy(false);
      if (err) {
        setError(/invalid/i.test(err.message) ? (hi ? "ईमेल या पासवर्ड गलत है" : "Incorrect email or password") : err.message);
        return;
      }
      navigate({ to: "/home" });
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email: value,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) navigate({ to: "/home" });
      else setInfo(hi ? "अपना ईमेल देखें और खाते की पुष्टि करें, फिर लॉगिन करें।" : "Check your email to confirm your account, then log in.");
    }
  };

  const onGoogle = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setError(result.error.message);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
    navigate({ to: "/home" });
  };

  const onForgot = async () => {
    setError(null);
    setInfo(null);
    const value = valid();
    if (!value) return;
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) setError(err.message);
    else setInfo(hi ? "पासवर्ड सेट करने का लिंक आपके ईमेल पर भेजा गया है।" : "We've emailed you a link to set your password.");
  };

  const input = "mt-2 w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-lg";

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8">
      <div className="flex justify-end gap-2 text-xs mb-6">
        <button onClick={() => setLang("en")} className={`px-3 py-1 rounded-full border ${lang === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>EN</button>
        <button onClick={() => setLang("hi")} className={`px-3 py-1 rounded-full border ${lang === "hi" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>हिं</button>
      </div>

      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-primary">
          <svg viewBox="0 0 24 24" width="34" height="34" className="fill-primary-foreground">
            <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{L.help}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 flex-1">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{L.email}</label>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{L.password}</label>
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className={input}
          />
          {mode === "login" && (
            <button type="button" onClick={onForgot} disabled={busy} className="mt-2 text-xs text-primary">
              {L.forgot}
            </button>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-primary">{info}</p>}

        <div className="mt-auto flex flex-col gap-3">
          <button type="submit" disabled={busy} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base press disabled:opacity-60">
            {busy ? L.wait : L.submit}
          </button>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{hi ? "या" : "or"}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="w-full py-3.5 rounded-full border border-border bg-background font-medium text-base press flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.57-5.17 3.57-8.87Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z" />
              <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.98 11.98 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
            </svg>
            {hi ? "Google से जारी रखें" : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setInfo(null); }}
            className="text-center text-sm text-primary"
          >
            {L.switchTo}
          </button>
          <Link to="/home" className="text-center text-xs text-muted-foreground">Browse demo chats →</Link>
        </div>
      </form>
    </div>
  );
}
