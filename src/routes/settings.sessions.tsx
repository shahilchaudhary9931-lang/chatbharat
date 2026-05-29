import { createFileRoute } from "@tanstack/react-router";
import { SettingsHeader, SettingsRow, Section } from "@/components/SettingsShell";
import { useSessions } from "@/lib/privacy-store";

export const Route = createFileRoute("/settings/sessions")({ component: SessionsPage });

function fmt(ts: number) {
  return new Date(ts).toLocaleString();
}

function SessionsPage() {
  const { list, end, endAllOther } = useSessions();
  return (
    <div className="min-h-screen bg-background pb-12">
      <SettingsHeader title="Active sessions" back="/settings" />
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground max-w-[60%]">
          Review where your account is active and end any session you don't recognize.
        </div>
        <button onClick={endAllOther} className="text-xs font-semibold text-destructive press">End all others</button>
      </div>
      <Section>
        {list.map((s) => (
          <SettingsRow
            key={s.id}
            icon={s.current ? "🟢" : "🖥️"}
            title={
              <span className="flex items-center gap-2">
                {s.device}
                {s.current && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">Active now</span>}
              </span>
            }
            subtitle={`${s.location} · ${s.ip} · since ${fmt(s.startedAt)}`}
            right={!s.current && <button onClick={() => end(s.id)} className="text-xs text-destructive font-semibold">End</button>}
          />
        ))}
      </Section>
    </div>
  );
}
