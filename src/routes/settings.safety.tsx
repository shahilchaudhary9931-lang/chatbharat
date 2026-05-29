import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsHeader, SettingsRow, Section } from "@/components/SettingsShell";

export const Route = createFileRoute("/settings/safety")({ component: SafetyPage });

const tips = [
  { icon: "🚨", title: "Report spam links", sub: "We scan suspicious URLs in your chats and flag risky links." },
  { icon: "🤬", title: "Detect abusive behavior", sub: "ML models flag harassment, hate speech, and threats." },
  { icon: "🕵️", title: "Report suspicious activity", sub: "Forward unusual login or message activity to our safety team." },
  { icon: "⚠️", title: "Warnings for spam accounts", sub: "Get a heads up before messaging an account flagged as spam." },
];

function SafetyPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <SettingsHeader title="Safety center" back="/settings" />
      <div className="px-6 py-6 text-center bg-card border-b border-border">
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl"
          style={{ background: "color-mix(in oklab, var(--color-primary) 15%, transparent)" }}>🛟</div>
        <h2 className="mt-3 font-semibold text-lg">Stay safe on ChatWave</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Tools to identify, avoid and report unwanted contact and harmful content.
        </p>
      </div>

      <Section title="Protections">
        {tips.map((t) => (
          <SettingsRow key={t.title} icon={t.icon} title={t.title} subtitle={t.sub} />
        ))}
      </Section>

      <Section title="Take action">
        <Link to="/settings/blocked"><SettingsRow icon="🚫" title="Blocked users" right={<span className="text-muted-foreground">›</span>} /></Link>
        <SettingsRow icon="📝" title="Report a problem" subtitle="Send a confidential report to our safety team" />
        <SettingsRow icon="📚" title="Safety guide" subtitle="Learn how to spot scams and stay private" />
      </Section>

      <div className="px-6 py-6 text-center text-[11px] text-muted-foreground">
        ChatWave never asks for your PIN, OTP or backup key.
      </div>
    </div>
  );
}
