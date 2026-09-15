import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { Ticks } from "@/components/Ticks";
import { fetchThread, sendDbMessage, deleteDbMessage, type DbMessage } from "@/lib/chat-db";
import { useI18n } from "@/lib/i18n";
import { getChatProfile } from "@/lib/profile-lookup.functions";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RealChat({ peerId }: { peerId: string }) {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const fetchChatProfile = useServerFn(getChatProfile);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [peerName, setPeerName] = useState("Chat");
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const L = useMemo(
    () => ({
      placeholder: lang === "hi" ? "संदेश लिखें" : "Type a message",
      empty: lang === "hi" ? "अभी कोई संदेश नहीं" : "No messages yet — say hello 👋",
      online: lang === "hi" ? "ऑनलाइन" : "online",
      deleteMsg: lang === "hi" ? "संदेश हटाएँ" : "Delete message",
      cancel: lang === "hi" ? "रद्द करें" : "Cancel",
    }),
    [lang],
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let active = true;
    (async () => {
      const [prof, thread] = await Promise.all([
        fetchChatProfile({ data: { profileId: peerId } }),
        fetchThread(user.id, peerId),
      ]);
      if (!active) return;
      setPeerName(prof?.username || "Chat");
      setMessages(thread);
      setReady(true);
    })();

    const channel = supabase
      .channel(`messages-${peerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as DbMessage;
          const mine = m.sender_id === user.id && m.receiver_id === peerId;
          const theirs = m.sender_id === peerId && m.receiver_id === user.id;
          if (!mine && !theirs) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old?.id) setMessages((prev) => prev.filter((x) => x.id !== old.id));
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user, loading, peerId, navigate, fetchChatProfile]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !user) return;
    setDraft("");
    const { data } = await sendDbMessage(user.id, peerId, text);
    if (data) {
      const m = data as DbMessage;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    }
  };

  const startPress = (id: string) => {
    pressTimer.current = setTimeout(() => setDeletingId(id), 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    setMessages((prev) => prev.filter((x) => x.id !== id));
    await deleteDbMessage(id);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-chat-bg)" }}>
      <header
        className="px-2 py-2 flex items-center gap-2 sticky top-0 z-20"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/home" })} className="p-1.5 rounded-full hover:bg-white/10 press" aria-label="back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <Avatar name={peerName} hue={200} size={38} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-tight truncate">{peerName}</div>
          <div className="text-[11px] opacity-80">{L.online}</div>
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {ready && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">{L.empty}</p>
        )}
        {messages.map((m) => {
          const fromMe = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm anim-bubble select-none ${fromMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
                style={{
                  background: fromMe ? "var(--color-bubble-out)" : "var(--color-bubble-in)",
                  color: "var(--color-foreground)",
                }}
                onPointerDown={() => startPress(m.id)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setDeletingId(m.id);
                }}
              >
                <span className="whitespace-pre-wrap break-words">{m.message_text}</span>
                <span className="ml-2 inline-flex items-center gap-1 align-bottom text-[10px] text-muted-foreground">
                  {timeOf(m.created_at)}
                  {fromMe && <Ticks status="delivered" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 px-2 py-2 flex items-end gap-2" style={{ background: "var(--color-chat-bg)" }}>
        <div className="flex-1 flex items-center bg-card rounded-full px-3 py-2 shadow-sm border border-border">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            placeholder={L.placeholder}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <button
          onClick={() => void send()}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow press"
          style={{ background: "var(--color-primary)" }}
          aria-label="send"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7Z" /></svg>
        </button>
      </div>
    </div>
  );
}
