import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getChat, contacts, type Message } from "@/lib/mock-data";
import { Avatar } from "@/components/Avatar";
import { Ticks } from "@/components/Ticks";

export const Route = createFileRoute("/chat/$id")({
  component: ChatScreen,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chat not found.</div>
  ),
  errorComponent: () => <div className="min-h-screen flex items-center justify-center">Something went wrong.</div>,
  loader: ({ params }) => {
    const chat = getChat(params.id);
    if (!chat) throw notFound();
    return chat;
  },
});

function ChatScreen() {
  const chat = Route.useLoaderData();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(chat.messages);
  const [draft, setDraft] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const contact = useMemo(() => contacts.find((c) => c.id === chat.contactId), [chat.contactId]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      fromMe: true,
      kind: "text",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };
    setMessages((m) => [...m, newMsg]);
    setDraft("");
    // simulate delivery + read receipts
    setTimeout(() => {
      setMessages((m) => m.map((x) => (x.id === newMsg.id ? { ...x, status: "delivered" } : x)));
    }, 700);
    setTimeout(() => {
      setMessages((m) => m.map((x) => (x.id === newMsg.id ? { ...x, status: "seen" } : x)));
    }, 1800);
    // simulate reply
    setTimeout(() => {
      const reply: Message = {
        id: `m${Date.now() + 1}`,
        fromMe: false,
        kind: "text",
        text: chat.isGroup ? "👍" : autoReply(text),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((m) => [...m, reply]);
    }, 2600);
  };

  const sendAttachment = (kind: "photo" | "video" | "voice") => {
    setShowAttach(false);
    const newMsg: Message = {
      id: `m${Date.now()}`,
      fromMe: true,
      kind,
      text: kind === "photo" ? "📷" : kind === "video" ? "🎥" : undefined,
      durationSec: kind === "voice" ? 8 : undefined,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };
    setMessages((m) => [...m, newMsg]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="px-2 pt-3 pb-2.5 flex items-center gap-2 sticky top-0 z-20"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/home" })} className="p-1.5 -ml-1 rounded-full hover:bg-white/10" aria-label="back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <Avatar name={chat.name} hue={chat.avatarHue} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{chat.name}</div>
          <div className="text-xs opacity-85">
            {chat.isGroup
              ? `${(chat.members?.length ?? 0) + 1} ${t("participants")}`
              : chat.typing
              ? t("typing")
              : contact?.online
              ? t("online")
              : `${t("lastSeen")} ${contact?.lastSeen ?? "—"}`}
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-white/10" aria-label="video">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 4v-11l-5 4Z"/></svg>
        </button>
        <button className="p-2 rounded-full hover:bg-white/10" aria-label="call">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.9.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.4.2 2.7.6 3.9.1.4 0 .8-.3 1.1l-2.2 2.1Z"/></svg>
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto chat-wallpaper px-3 py-4">
        <div className="flex justify-center mb-3">
          <span className="text-xs px-3 py-1 rounded-md bg-card text-muted-foreground shadow-sm">{t("today")}</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const grouped = prev && prev.fromMe === m.fromMe;
            return <Bubble key={m.id} msg={m} grouped={!!grouped} />;
          })}
        </ul>
      </div>

      {/* Composer */}
      <div className="px-2 py-2 flex items-end gap-2 border-t border-border bg-background relative">
        {showAttach && (
          <div className="absolute bottom-16 left-3 right-3 bg-popover rounded-2xl shadow-xl p-4 grid grid-cols-3 gap-3 border border-border z-10">
            <AttachBtn label={t("photo")} color="#bf59cf" onClick={() => sendAttachment("photo")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 13.5l2.5 3 3.5-4.5L19 18H5l3.5-4.5Z"/></svg>
            </AttachBtn>
            <AttachBtn label={t("video")} color="#f76454" onClick={() => sendAttachment("video")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 4v-11l-5 4Z"/></svg>
            </AttachBtn>
            <AttachBtn label={t("voice")} color="#f4a93d" onClick={() => sendAttachment("voice")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z"/></svg>
            </AttachBtn>
          </div>
        )}

        <div className="flex-1 bg-input rounded-full flex items-center px-3 py-2 gap-2">
          <button className="text-muted-foreground" aria-label="emoji">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.5 2 4 2s3-.5 4-2"/><circle cx="9" cy="10" r="0.8" fill="currentColor"/><circle cx="15" cy="10" r="0.8" fill="currentColor"/></svg>
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("typeMessage")}
            className="flex-1 bg-transparent outline-none text-sm py-1"
          />
          <button onClick={() => setShowAttach((v) => !v)} className="text-muted-foreground" aria-label="attach">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.5L13 20.5a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 1 1 5 5L11.5 18a2 2 0 0 1-3-3l7-7"/></svg>
          </button>
        </div>
        <button
          onClick={draft.trim() ? send : () => sendAttachment("voice")}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ background: "var(--color-primary)" }}
          aria-label={draft.trim() ? t("send") : t("voice")}
        >
          {draft.trim() ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l13 2-13 2v6Z"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}

function AttachBtn({ children, color, label, onClick }: { children: React.ReactNode; color: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: color }}>
        {children}
      </span>
      <span className="text-xs text-foreground">{label}</span>
    </button>
  );
}

function Bubble({ msg, grouped }: { msg: Message; grouped: boolean }) {
  const isOut = msg.fromMe;
  return (
    <li className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[78%] rounded-xl px-2.5 pt-1.5 pb-1 shadow-sm ${grouped ? "" : isOut ? "bubble-tail-out" : "bubble-tail-in"}`}
        style={{
          background: isOut ? "var(--color-bubble-out)" : "var(--color-bubble-in)",
          color: isOut ? "var(--color-bubble-out-foreground)" : "var(--color-bubble-in-foreground)",
          borderTopRightRadius: isOut && !grouped ? 4 : undefined,
          borderTopLeftRadius: !isOut && !grouped ? 4 : undefined,
        }}
      >
        {msg.kind === "text" && <p className="text-sm whitespace-pre-wrap break-words pr-12">{msg.text}</p>}
        {msg.kind === "photo" && (
          <div className="rounded-lg overflow-hidden mb-1 w-56 h-40 flex items-center justify-center text-5xl"
               style={{ background: "linear-gradient(135deg, hsl(190 60% 60%), hsl(220 70% 45%))" }}>
            {msg.text || "📷"}
          </div>
        )}
        {msg.kind === "video" && (
          <div className="rounded-lg overflow-hidden mb-1 w-56 h-40 flex items-center justify-center text-5xl relative"
               style={{ background: "linear-gradient(135deg, hsl(0 0% 20%), hsl(0 0% 5%))" }}>
            <span className="text-white/90">{msg.text || "🎥"}</span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-black/55 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7L8 5Z"/></svg>
              </span>
            </span>
          </div>
        )}
        {msg.kind === "voice" && <VoiceBubble seconds={msg.durationSec ?? 5} isOut={isOut} />}

        <div className="flex items-center justify-end gap-1 -mt-0.5">
          <span className="text-[10px] opacity-70">{msg.time}</span>
          {isOut && <Ticks status={msg.status} />}
        </div>
      </div>
    </li>
  );
}

function VoiceBubble({ seconds, isOut }: { seconds: number; isOut: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1 pr-12 min-w-[180px]">
      <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isOut ? "rgba(0,0,0,0.15)" : "var(--color-primary)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7L8 5Z"/></svg>
      </button>
      <div className="flex items-end gap-[2px] h-6">
        {Array.from({ length: 22 }).map((_, i) => (
          <span key={i} className="w-[2px] rounded-full" style={{ height: `${20 + Math.sin(i) * 12 + (i % 3) * 4}%`, background: "currentColor", opacity: 0.6 }} />
        ))}
      </div>
      <span className="text-[10px] opacity-70">0:{seconds.toString().padStart(2, "0")}</span>
    </div>
  );
}

function autoReply(text: string) {
  const t = text.toLowerCase();
  if (/hi|hello|hey|namaste|नमस्ते/.test(t)) return "Namaste 🙏 कैसे हो?";
  if (/\?/.test(t)) return "Hmm, sochke batata hoon 🤔";
  if (/thanks|thank you|dhanyavad/.test(t)) return "Welcome 😊";
  return "Okay! 👍";
}

// Suppress unused import warnings in dev
void Link;
