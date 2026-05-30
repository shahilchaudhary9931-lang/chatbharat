import { useEffect, useState } from "react";
import { useSecurity } from "@/lib/privacy-store";

const SESSION_KEY = "cw_app_unlocked";

export function AppLockGate() {
  const [s] = useSecurity();
  const [unlocked, setUnlocked] = useState(true);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (s.appLock === "off") { setUnlocked(true); return; }
    const ok = sessionStorage.getItem(SESSION_KEY) === "1";
    setUnlocked(ok);
  }, [s.appLock]);

  if (s.appLock === "off" || unlocked) return null;

  const unlock = () => {
    if (s.appLock === "pin") {
      if (!s.appLockPin || pin !== s.appLockPin) { setErr("Incorrect PIN"); return; }
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setUnlocked(true);
    setPin(""); setErr("");
  };

  const label =
    s.appLock === "pin" ? "Enter your PIN" :
    s.appLock === "fingerprint" ? "Touch the sensor to unlock" :
    "Look at the camera to unlock";

  const icon = s.appLock === "pin" ? "🔐" : s.appLock === "fingerprint" ? "👆" : "🙂";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background anim-page px-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
        style={{ background: "color-mix(in oklab, var(--color-primary) 15%, transparent)" }}>{icon}</div>
      <h1 className="text-xl font-semibold">ChatWave is locked</h1>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>

      {s.appLock === "pin" ? (
        <div className="mt-6 w-full max-w-xs">
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary"
          />
          {err && <div className="text-xs text-destructive text-center mt-2">{err}</div>}
          <button onClick={unlock}
            className="w-full mt-4 py-3 rounded-full font-semibold text-white shadow press"
            style={{ background: "var(--color-primary)" }}>Unlock</button>
        </div>
      ) : (
        <button onClick={unlock}
          className="mt-6 py-3 px-8 rounded-full font-semibold text-white shadow press"
          style={{ background: "var(--color-primary)" }}>Unlock</button>
      )}
    </div>
  );
}
