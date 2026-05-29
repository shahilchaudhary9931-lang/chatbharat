import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SettingsHeader, SettingsRow, Section } from "@/components/SettingsShell";
import { useBlocked } from "@/lib/privacy-store";

export const Route = createFileRoute("/settings/blocked")({ component: BlockedPage });

function BlockedPage() {
  const { list, add, remove } = useBlocked();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const submit = () => {
    if (!name.trim() || !phone.trim()) return;
    add({ id: phone.replace(/\D/g, "") || Date.now().toString(), name: name.trim(), phone: phone.trim() });
    setOpen(false); setName(""); setPhone("");
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <SettingsHeader title="Blocked users" back="/settings/privacy" />
      <div className="px-5 py-4 text-xs text-muted-foreground">
        Blocked contacts can't call you or send you messages. They won't see your last seen, online status, or profile updates.
      </div>

      <Section>
        <SettingsRow icon="➕" title="Add blocked contact" onClick={() => setOpen(true)} />
      </Section>

      {list.length > 0 && (
        <Section title={`${list.length} blocked`}>
          {list.map((b) => (
            <SettingsRow
              key={b.id}
              icon={b.name.charAt(0).toUpperCase()}
              title={b.name}
              subtitle={b.phone}
              right={<button onClick={() => remove(b.id)} className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>Unblock</button>}
            />
          ))}
        </Section>
      )}

      {list.length === 0 && (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          You haven't blocked anyone.
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 anim-slide-up">
            <h3 className="font-semibold text-lg">Block a contact</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
              className="mt-3 w-full px-3 py-2 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210"
              className="mt-2 w-full px-3 py-2 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-full text-sm font-semibold border border-border press">Cancel</button>
              <button onClick={submit} className="px-5 py-2 rounded-full text-sm font-semibold text-white shadow press" style={{ background: "var(--color-destructive)" }}>Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
