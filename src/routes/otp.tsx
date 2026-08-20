import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/otp")({
  component: Otp,
});

function Otp() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [email, setEmail] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifying = useRef(false);

  const L = {
    back: lang === "hi" ? "ईमेल बदलें" : "Change email",
    title: lang === "hi" ? "कोड डालें" : "Enter the code",
    subtitle: lang === "hi" ? "हमने कोड भेजा है" : "We sent a 6-digit code to",
    didnt: lang === "hi" ? "कोड नहीं मिला?" : "Didn't get the code?",
    resend: lang === "hi" ? "फिर भेजें" : "Resend",
    verifying: lang === "hi" ? "जाँच हो रही है…" : "Verifying…",
    hint:
      lang === "hi"
        ? "ईमेल में मौजूद मैजिक लिंक पर टैप करके भी लॉगिन कर सकते हैं।"
        : "You can also just tap the magic link in the email.",
  };

  useEffect(() => {
    setEmail(localStorage.getItem("cw_email") || "");
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (!email || verifying.current || code.some((c) => c === "")) return;
    verifying.current = true;
    setBusy(true);
    setError(null);
    supabase.auth
      .verifyOtp({ email, token: code.join(""), type: "email" })
      .then(({ error: err }) => {
        setBusy(false);
        verifying.current = false;
        if (err) {
          setError(err.message);
          setCode(["", "", "", "", "", ""]);
          refs.current[0]?.focus();
          return;
        }
        navigate({ to: "/home" });
      });
  }, [code, email, navigate]);

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = digits.slice(0, 6).split("");
      setCode([0, 1, 2, 3, 4, 5].map((n) => next[n] ?? ""));
      refs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const next = [...code];
    next[i] = digits.slice(-1);
    setCode(next);
    if (digits && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const resend = async () => {
    if (!email) return;
    setSeconds(45);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/home` },
    });
    if (err) setError(err.message);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8">
      <Link to="/login" className="text-sm text-primary mb-6">← {L.back}</Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {L.subtitle} <span className="font-semibold text-foreground">{email || "—"}</span>
        </p>
      </div>

      <div className="flex gap-2 justify-between mb-4">
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={c}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={busy}
            className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
        ))}
      </div>

      {busy && <p className="text-xs text-center text-muted-foreground mb-2">{L.verifying}</p>}
      {error && <p role="alert" className="text-sm text-destructive text-center mb-2">{error}</p>}

      <p className="text-xs text-muted-foreground text-center">
        {L.didnt}{" "}
        {seconds > 0 ? (
          <span>00:{seconds.toString().padStart(2, "0")}</span>
        ) : (
          <button onClick={resend} className="text-primary font-semibold">
            {L.resend}
          </button>
        )}
      </p>

      <p className="mt-6 text-center text-xs text-muted-foreground max-w-xs mx-auto">{L.hint}</p>
    </div>
  );
}
