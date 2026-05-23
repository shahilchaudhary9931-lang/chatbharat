import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/otp")({
  component: Otp,
});

function Otp() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [phone, setPhone] = useState("");
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    setPhone(localStorage.getItem("cw_phone") || "");
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (code.every((c) => c !== "")) {
      const timer = setTimeout(() => {
        localStorage.setItem("cw_user", JSON.stringify({ phone, name: "You", joined: Date.now() }));
        navigate({ to: "/home" });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [code, navigate, phone]);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8">
      <Link to="/login" className="text-sm text-primary mb-6">← {t("changeNumber")}</Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("otpTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("otpSubtitle")} <span className="font-semibold text-foreground">+91 {phone}</span>
        </p>
      </div>

      <div className="flex gap-2 justify-between mb-8">
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={c}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="numeric"
            maxLength={1}
            className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("didntGet")}{" "}
        {seconds > 0 ? (
          <span>00:{seconds.toString().padStart(2, "0")}</span>
        ) : (
          <button onClick={() => setSeconds(30)} className="text-primary font-semibold">
            {t("resend")}
          </button>
        )}
      </p>

      <p className="text-xs text-muted-foreground text-center mt-6 opacity-60">
        Demo: enter any 6 digits.
      </p>
    </div>
  );
}
