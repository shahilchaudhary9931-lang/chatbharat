import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsHeader, SettingsRow, Section } from "@/components/SettingsShell";

export const Route = createFileRoute("/settings")({ component: SettingsHub });

function SettingsHub() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <SettingsHeader title="Settings" back="/home" />
      <Section>
        <Link to="/profile"><SettingsRow icon="👤" title="Profile" subtitle="Name, photo, about" right={<Chev/>} /></Link>
        <Link to="/settings/privacy"><SettingsRow icon="🔒" title="Privacy" subtitle="Last seen, profile photo, blocked" right={<Chev/>} /></Link>
        <Link to="/settings/security"><SettingsRow icon="🛡️" title="Security" subtitle="Two-step verification, encryption" right={<Chev/>} /></Link>
        <Link to="/settings/app-lock"><SettingsRow icon="🔐" title="App lock" subtitle="Fingerprint, Face, PIN" right={<Chev/>} /></Link>
      </Section>
      <Section title="Account & devices">
        <Link to="/settings/devices"><SettingsRow icon="📱" title="Linked devices" subtitle="Manage where you are signed in" right={<Chev/>} /></Link>
        <Link to="/settings/sessions"><SettingsRow icon="🖥️" title="Active sessions" subtitle="Recent logins" right={<Chev/>} /></Link>
        <Link to="/settings/blocked"><SettingsRow icon="🚫" title="Blocked users" right={<Chev/>} /></Link>
      </Section>
      <Section title="Safety">
        <Link to="/settings/safety"><SettingsRow icon="🛟" title="Safety center" subtitle="Spam, abuse, reports" right={<Chev/>} /></Link>
      </Section>
    </div>
  );
}

function Chev() {
  return <span className="text-muted-foreground">›</span>;
}
