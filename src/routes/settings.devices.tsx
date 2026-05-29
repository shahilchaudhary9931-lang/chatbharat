import { createFileRoute } from "@tanstack/react-router";
import { SettingsHeader, SettingsRow, Section } from "@/components/SettingsShell";
import { useDevices } from "@/lib/privacy-store";

export const Route = createFileRoute("/settings/devices")({ component: DevicesPage });

function timeAgo(ts: number) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function DevicesPage() {
  const { list, revoke, trust } = useDevices();
  return (
    <div className="min-h-screen bg-background pb-12">
      <SettingsHeader title="Linked devices" back="/settings" />
      <div className="px-5 py-4 text-xs text-muted-foreground">
        Use ChatWave on up to 4 linked devices. Messages stay end-to-end encrypted across all of them.
      </div>
      <Section>
        {list.map((d) => (
          <SettingsRow
            key={d.id}
            icon={d.platform.includes("Web") ? "🖥️" : "📱"}
            title={
              <span className="flex items-center gap-2">
                {d.name}
                {d.current && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">This device</span>}
                {!d.trusted && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">Unverified</span>}
              </span>
            }
            subtitle={`${d.platform} · ${d.location} · ${timeAgo(d.lastActive)}`}
            right={!d.current && (
              <div className="flex flex-col items-end gap-1">
                {!d.trusted && <button onClick={() => trust(d.id, true)} className="text-[11px] font-semibold" style={{ color: "var(--color-primary)" }}>Verify</button>}
                <button onClick={() => revoke(d.id)} className="text-[11px] font-semibold text-destructive">Log out</button>
              </div>
            )}
          />
        ))}
      </Section>
    </div>
  );
}
