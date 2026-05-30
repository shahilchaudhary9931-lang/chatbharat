import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SettingsHeader, SettingsRow, Section, Toggle, Pill } from "@/components/SettingsShell";
import { usePrivacy, type Audience } from "@/lib/privacy-store";

export const Route = createFileRoute("/settings/privacy")({ component: PrivacyPage });

const audiences: { v: Audience; label: string }[] = [
  { v: "everyone", label: "Everyone" },
  { v: "contacts", label: "My contacts" },
  { v: "nobody", label: "Nobody" },
];

function PrivacyPage() {
  const [p, update] = usePrivacy();
  const [saved, setSaved] = useState(false);
  const patch = (x: Parameters<typeof update>[0]) => {
    update(x);
    setSaved(true);
  };
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <SettingsHeader title="Privacy" back="/settings" />

      {saved && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg anim-pop"
          style={{ background: "var(--color-primary)" }}>
          ✓ Saved
        </div>
      )}

      <Section title="Quick controls">
        <SettingsRow
          icon="👁️"
          title="Hide last seen"
          subtitle="No one will see when you were last online"
          right={<Toggle checked={p.lastSeen === "nobody"} onChange={(v) => patch({ lastSeen: v ? "nobody" : "everyone" })} />}
        />
        <SettingsRow
          icon="🟢"
          title="Hide online status"
          subtitle="Appear offline to others"
          right={<Toggle checked={p.online !== "everyone"} onChange={(v) => patch({ online: v ? "same-as-last-seen" : "everyone" })} />}
        />
        <SettingsRow
          icon="🖼️"
          title="Hide profile photo"
          subtitle="Only you will see your photo"
          right={<Toggle checked={p.profilePhoto === "nobody"} onChange={(v) => patch({ profilePhoto: v ? "nobody" : "everyone" })} />}
        />
        <SettingsRow
          icon="✓✓"
          title="Read receipts"
          subtitle="Send and receive blue ticks"
          right={<Toggle checked={p.readReceipts} onChange={(v) => patch({ readReceipts: v })} />}
        />
      </Section>

      <Section title="Who can see my personal info">
        <RowChoice label="Last seen & online" value={p.lastSeen} onChange={(v) => patch({ lastSeen: v })} />
        <RowChoice label="Profile photo" value={p.profilePhoto} onChange={(v) => patch({ profilePhoto: v })} />
        <RowChoice label="About" value={p.about} onChange={(v) => patch({ about: v })} />
        <RowChoice label="Status" value={p.status} onChange={(v) => patch({ status: v })} />
        <SettingsRow
          icon="📞"
          title="Hide phone number"
          subtitle="Your number won't be visible in your profile"
          right={<Toggle checked={p.hidePhone} onChange={(v) => patch({ hidePhone: v })} />}
        />
      </Section>

      <Section title="Messaging">
        <SettingsRow
          icon="✓✓"
          title="Read receipts"
          subtitle="If turned off, you won't send or see read receipts"
          right={<Toggle checked={p.readReceipts} onChange={(v) => update({ readReceipts: v })} />}
        />
        <SettingsRow
          icon="⌨️"
          title="Typing indicator"
          subtitle="Show when you're typing"
          right={<Toggle checked={p.typingIndicator} onChange={(v) => update({ typingIndicator: v })} />}
        />
        <div className="px-4 py-3 border-b border-border/60">
          <div className="text-[15px] font-medium mb-2">Who can message me</div>
          <div className="flex gap-2">
            <Pill active={p.messageFrom === "everyone"} onClick={() => update({ messageFrom: "everyone" })}>Everyone</Pill>
            <Pill active={p.messageFrom === "contacts"} onClick={() => update({ messageFrom: "contacts" })}>My contacts</Pill>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-border/60">
          <div className="text-[15px] font-medium mb-2">Who can add me to groups</div>
          <div className="flex gap-2">
            {audiences.map((a) => (
              <Pill key={a.v} active={p.groups === a.v} onClick={() => update({ groups: a.v })}>{a.label}</Pill>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Chat privacy">
        <div className="px-4 py-3 border-b border-border/60">
          <div className="text-[15px] font-medium">Default disappearing messages</div>
          <div className="text-xs text-muted-foreground mt-0.5 mb-2">Applies to all new chats you start.</div>
          <div className="flex gap-2 flex-wrap">
            {(["off","24h","7d","90d"] as const).map((d) => (
              <Pill key={d} active={p.disappearingDefault === d} onClick={() => update({ disappearingDefault: d })}>
                {d === "off" ? "Off" : d}
              </Pill>
            ))}
          </div>
        </div>
        <SettingsRow
          icon="📸"
          title="Screenshot protection"
          subtitle="Block screenshots in private chats and view-once media"
          right={<Toggle checked={p.screenshotProtection} onChange={(v) => update({ screenshotProtection: v })} />}
        />
        <SettingsRow
          icon="🔏"
          title="Private account mode"
          subtitle="Only your contacts can find you and see your activity"
          right={<Toggle checked={p.privateAccount} onChange={(v) => update({ privateAccount: v })} />}
        />
      </Section>

      <Section title="Lists">
        <Link to="/settings/blocked"><SettingsRow icon="🚫" title="Blocked users" right={<span className="text-muted-foreground">›</span>} /></Link>
      </Section>
    </div>
  );
}

function RowChoice({ label, value, onChange }: { label: string; value: Audience; onChange: (v: Audience) => void }) {
  return (
    <div className="px-4 py-3 border-b border-border/60">
      <div className="text-[15px] font-medium mb-2">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {audiences.map((a) => (
          <Pill key={a.v} active={value === a.v} onClick={() => onChange(a.v)}>{a.label}</Pill>
        ))}
      </div>
    </div>
  );
}
