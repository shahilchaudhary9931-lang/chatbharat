import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Global online presence: every signed-in tab joins one channel keyed by user id.
let channel: RealtimeChannel | null = null;
let online = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function startPresence(userId: string) {
  if (channel) return () => {};
  const ch = supabase.channel("online-users", { config: { presence: { key: userId } } });
  ch.on("presence", { event: "sync" }, () => {
    online = new Set(Object.keys(ch.presenceState()));
    emit();
  }).subscribe((status) => {
    if (status === "SUBSCRIBED") void ch.track({ at: Date.now() });
  });
  channel = ch;

  const touch = () =>
    void supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);
  touch();
  const iv = setInterval(touch, 60_000);
  const onVis = () => touch();
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", onVis);

  return () => {
    clearInterval(iv);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pagehide", onVis);
    touch();
    void supabase.removeChannel(ch);
    channel = null;
    online = new Set();
    emit();
  };
}

export function useIsOnline(userId: string) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const l = () => setV(online.has(userId));
    l();
    listeners.add(l);
    return () => void listeners.delete(l);
  }, [userId]);
  return v;
}
