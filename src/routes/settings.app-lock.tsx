import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SettingsHeader, Section, SettingsRow } from "@/components/SettingsShell";
import { useSecurity } from "@/lib/privacy-store";

export const Route = createFileRoute("/settings/app-lock")({ component: AppLockPage });

function AppLockPage() {
  const [s, update] = useSecurity();
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pin, setPin] = useState("");

  const setMode = (mode: typeof s.appLock) => {
    if (mode === "off") update({ appLock: "off", appLockPin: null });
    else if (mode === "pin") setPinPrompt(true);
    else update({ appLock: mode });
  };

  const savePin = () => {
    if (pin.length < 4) return;
    update({ appLock: "pin", appLockPin: pin });
    setPinPrompt(false); setPin("");
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <SettingsHeader title="App lock" back="/settings/security" />
      <div className="px-6 py-6 text-center">
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl"
          style={{ background: "color-mix(in oklab, var(--color-primary) 15%, transparent)" }}>🔐</div>
        <p className="text-xs text-muted-foreground mt-3 max-w-xs mx-auto">
          Require authentication to open ChatWave. Notifications still arrive.
        </p>
      </div>

      <Section>
        <Choice label="Off" sub="App lock disabled" active={s.appLock === "off"} onClick={() => setMode("off")} />
        <Choice label="PIN" sub="4 to 6 digit code" active={s.appLock === "pin"} onClick={() => setMode("pin")} />
        <Choice label="Fingerprint" sub="Use device fingerprint" active={s.appLock === "fingerprint"} onClick={() => setMode("fingerprint")} />
        <Choice label="Face unlock" sub="Use device face recognition" active={s.appLock === "face"} onClick={() => setMode("face")} />
      </Section>

      {pinPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 anim-slide-up">
            <h3 className="font-semibold text-lg">Set app lock PIN</h3>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••"
              className="mt-4 w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => { setPinPrompt(false); setPin(""); }} className="px-4 py-2 rounded-full text-sm font-semibold border border-border press">Cancel</button>
              <button onClick={savePin} disabled={pin.length < 4}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white shadow disabled:opacity-50 press"
                style={{ background: "var(--color-primary)" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Choice({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <SettingsRow
      title={label}
      subtitle={sub}
      onClick={onClick}
      right={<span className={`w-5 h-5 rounded-full border-2 ${active ? "border-primary" : "border-border"} flex items-center justify-center`}>
        {active && <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-primary)" }} />}
      </span>}
    />
  );
}
