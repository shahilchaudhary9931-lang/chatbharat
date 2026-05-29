import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SettingsHeader, SettingsRow, Section, Toggle } from "@/components/SettingsShell";
import { useSecurity } from "@/lib/privacy-store";

export const Route = createFileRoute("/settings/security")({ component: SecurityPage });

function SecurityPage() {
  const [s, update] = useSecurity();
  const navigate = useNavigate();
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");

  const enable2FA = () => {
    if (pin.length !== 6) return;
    update({ twoStepEnabled: true, twoStepPin: pin });
    setShowPin(false); setPin("");
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <SettingsHeader title="Security" back="/settings" />

      {/* Hero */}
      <div className="px-6 py-8 text-center bg-card border-b border-border">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl"
             style={{ background: "color-mix(in oklab, var(--color-primary) 15%, transparent)" }}>🛡️</div>
        <h2 className="mt-3 font-semibold text-lg">Your chats are protected</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          End-to-end encryption keeps your personal messages and calls between you and the people you choose. Not even ChatWave can read them.
        </p>
      </div>

      <Section title="Account protection">
        <SettingsRow
          icon="🔐"
          title="End-to-end encryption"
          subtitle="All chats protected by default"
          right={<Toggle checked={s.e2eeEnabled} onChange={(v) => update({ e2eeEnabled: v })} />}
        />
        <SettingsRow
          icon="🔢"
          title="Two-step verification"
          subtitle={s.twoStepEnabled ? "Enabled · 6-digit PIN" : "Add an extra PIN to protect your account"}
          right={s.twoStepEnabled
            ? <button onClick={() => update({ twoStepEnabled: false, twoStepPin: null })} className="text-xs text-destructive font-semibold">Disable</button>
            : <button onClick={() => setShowPin(true)} className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>Enable</button>}
        />
        <SettingsRow
          icon="🔑"
          title="App lock"
          subtitle={s.appLock === "off" ? "Off" : `On · ${s.appLock}`}
          onClick={() => navigate({ to: "/settings/app-lock" })}
          right={<span className="text-muted-foreground">›</span>}
        />
      </Section>

      <Section title="Devices & sessions">
        <Link to="/settings/devices"><SettingsRow icon="📱" title="Linked devices" subtitle="Manage where you are signed in" right={<span className="text-muted-foreground">›</span>} /></Link>
        <Link to="/settings/sessions"><SettingsRow icon="🖥️" title="Active sessions" subtitle="Recent logins" right={<span className="text-muted-foreground">›</span>} /></Link>
        <SettingsRow
          icon="🚪"
          title="Auto logout from unknown devices"
          subtitle="Sign out devices that haven't been verified"
          right={<Toggle checked={s.autoLogoutUnknown} onChange={(v) => update({ autoLogoutUnknown: v })} />}
        />
      </Section>

      <Section title="Backups & spam">
        <SettingsRow
          icon="☁️"
          title="Secure cloud backup"
          subtitle="Encrypted backups, only you hold the key"
          right={<Toggle checked={s.secureBackup} onChange={(v) => update({ secureBackup: v })} />}
        />
        <SettingsRow
          icon="🛑"
          title="Anti-spam protection"
          subtitle="Detect and filter spam messages"
          right={<Toggle checked={s.spamProtection} onChange={(v) => update({ spamProtection: v })} />}
        />
        <SettingsRow
          icon="🤖"
          title="Fake account detection"
          subtitle="Warn about suspicious or newly created accounts"
          right={<Toggle checked={s.fakeAccountDetection} onChange={(v) => update({ fakeAccountDetection: v })} />}
        />
        <SettingsRow
          icon="⏱️"
          title="Rate limiting"
          subtitle="Throttle excessive messages and OTP requests"
          right={<Toggle checked={s.rateLimit} onChange={(v) => update({ rateLimit: v })} />}
        />
      </Section>

      {showPin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 anim-page">
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 anim-slide-up">
            <h3 className="font-semibold text-lg">Set 6-digit PIN</h3>
            <p className="text-xs text-muted-foreground mt-1">You'll need this PIN to verify your account in the future.</p>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-4 w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••"
            />
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => { setShowPin(false); setPin(""); }} className="px-4 py-2 rounded-full text-sm font-semibold border border-border press">Cancel</button>
              <button onClick={enable2FA} disabled={pin.length !== 6}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white shadow disabled:opacity-50 press"
                style={{ background: "var(--color-primary)" }}>Enable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
