import { useEffect, useRef } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getChatProfile } from "@/lib/profile-lookup.functions";
import type { DbMessage } from "@/lib/chat-db";

/**
 * Listens for incoming 1-to-1 messages and raises a browser notification
 * when the matching chat is not the visible screen.
 */
export function MessageNotifier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const fetchChatProfile = useServerFn(getChatProfile);
  const nameCache = useRef(new Map<string, string>());

  // Ask for permission on the first user interaction (browsers require a gesture).
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const ask = () => {
      void Notification.requestPermission();
      window.removeEventListener("pointerdown", ask);
    };
    window.addEventListener("pointerdown", ask, { once: true });
    return () => window.removeEventListener("pointerdown", ask);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const channel = supabase
      .channel(`notify-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const m = payload.new as DbMessage;
          if (!m || m.sender_id === user.id) return;
          if (Notification.permission !== "granted") return;

          const chatOpen =
            pathRef.current.startsWith(`/chat/${m.sender_id}`) &&
            typeof document !== "undefined" &&
            document.visibilityState === "visible";
          if (chatOpen) return;

          void (async () => {
            let name = nameCache.current.get(m.sender_id);
            if (!name) {
              try {
                const prof = await fetchChatProfile({ data: { profileId: m.sender_id } });
                name = prof?.username || "New message";
              } catch {
                name = "New message";
              }
              nameCache.current.set(m.sender_id, name);
            }
            const n = new Notification(name, {
              body: m.message_text.slice(0, 120),
              tag: `chat-${m.sender_id}`,
              icon: "/favicon.ico",
            });
            n.onclick = () => {
              window.focus();
              void navigate({ to: "/chat/$id", params: { id: m.sender_id } });
              n.close();
            };
          })();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, navigate, fetchChatProfile]);

  return null;
}
