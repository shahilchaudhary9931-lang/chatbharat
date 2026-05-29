import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getChat, contacts, chats as allChats, type Message } from "@/lib/mock-data";
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

interface XMessage extends Message {
  starred?: boolean;
  deleted?: boolean;
  replyToId?: string;
  replyToText?: string;
  replyToFromMe?: boolean;
  isNew?: boolean;
}

const EMOJIS = ["😀","😂","🥲","😍","😘","🤩","🤔","😎","😴","😭","😡","👍","🙏","👏","🔥","💯","❤️","💔","🎉","🌹","☕","🍕","✈️","⚽","🎵","📷","🎥","🤝","💪","🙈"];

function ChatScreen() {
  const chat = Route.useLoaderData();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<XMessage[]>(chat.messages);
  const [draft, setDraft] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<XMessage | null>(null);
  const [forwardMsg, setForwardMsg] = useState<XMessage | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<XMessage | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const contact = useMemo(() => contacts.find((c) => c.id === chat.contactId), [chat.contactId]);
  const selected = messages.find((m) => m.id === selectedId);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages.length, isTyping]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const newMsg: XMessage = {
      id: `m${Date.now()}`,
      fromMe: true,
      kind: "text",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      isNew: true,
      replyToId: replyTo?.id,
      replyToText: replyTo?.text || (replyTo ? `[${replyTo.kind}]` : undefined),
      replyToFromMe: replyTo?.fromMe,
    };
    setMessages((m) => [...m, newMsg]);
    setDraft("");
    setReplyTo(null);
    setShowEmoji(false);
    setTimeout(() => setMessages((m) => m.map((x) => x.id === newMsg.id ? { ...x, status: "delivered" } : x)), 700);
    setTimeout(() => setMessages((m) => m.map((x) => x.id === newMsg.id ? { ...x, status: "seen" } : x)), 1800);
    setTimeout(() => setIsTyping(true), 2200);
    setTimeout(() => {
      setIsTyping(false);
      const reply: XMessage = {
        id: `m${Date.now() + 1}`,
        fromMe: false,
        kind: "text",
        text: chat.isGroup ? "👍" : autoReply(text),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isNew: true,
      };
      setMessages((m) => [...m, reply]);
    }, 3400);
  };

  const sendAttachment = (kind: "photo" | "video" | "voice") => {
    setShowAttach(false);
    setMessages((m) => [...m, {
      id: `m${Date.now()}`,
      fromMe: true,
      kind,
      text: kind === "photo" ? "📷" : kind === "video" ? "🎥" : undefined,
      durationSec: kind === "voice" ? 8 : undefined,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      isNew: true,
    }]);
  };

  const toggleStar = (id: string) => {
    setMessages((m) => m.map((x) => x.id === id ? { ...x, starred: !x.starred } : x));
    setSelectedId(null);
  };
  const doReply = (m: XMessage) => { setReplyTo(m); setSelectedId(null); };
  const doDelete = (forEveryone: boolean) => {
    if (!deleteMsg) return;
    setMessages((m) => forEveryone || !deleteMsg.fromMe
      ? m.map((x) => x.id === deleteMsg.id ? { ...x, deleted: true, text: undefined, kind: "text" as const } : x)
      : m.filter((x) => x.id !== deleteMsg.id));
    setDeleteMsg(null);
    setSelectedId(null);
  };
  const doForward = (toChatId: string) => {
    // demo only — show toast-like via console; in real app would push to that chat
    setForwardMsg(null);
    setSelectedId(null);
    if (toChatId === chat.id) return;
  };

  const visibleMessages = useMemo(() => {
    if (!searchOpen || !searchQ.trim()) return messages;
    const s = searchQ.toLowerCase();
    return messages.filter((m) => (m.text || "").toLowerCase().includes(s));
  }, [messages, searchOpen, searchQ]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {selectedId && selected ? (
        <header className="px-2 pt-3 pb-2.5 flex items-center gap-1 sticky top-0 z-20 anim-fade"
          style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}>
          <button onClick={() => setSelectedId(null)} className="p-2 rounded-full hover:bg-white/10" aria-label="close">
            <IconClose />
          </button>
          <div className="flex-1 font-semibold">1</div>
          <IconBtn label={t("reply")} onClick={() => doReply(selected)}><IconReply /></IconBtn>
          <IconBtn label={selected.starred ? t("unstar") : t("star")} onClick={() => toggleStar(selected.id)}>
            <IconStar filled={!!selected.starred} />
          </IconBtn>
          <IconBtn label={t("forward")} onClick={() => setForwardMsg(selected)}><IconForward /></IconBtn>
          <IconBtn label={t("copy")} onClick={() => { if (selected.text) navigator.clipboard?.writeText(selected.text); setSelectedId(null); }}><IconCopy /></IconBtn>
          <IconBtn label={t("deleteMsg")} onClick={() => setDeleteMsg(selected)}><IconTrash /></IconBtn>
        </header>
      ) : searchOpen ? (
        <header className="px-2 pt-3 pb-2.5 flex items-center gap-2 sticky top-0 z-20 anim-fade"
          style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}>
          <button onClick={() => { setSearchOpen(false); setSearchQ(""); }} className="p-2 rounded-full hover:bg-white/10" aria-label="back">
            <IconBack />
          </button>
          <input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t("searchInChat")}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/70" />
        </header>
      ) : (
        <header className="px-2 pt-3 pb-2.5 flex items-center gap-2 sticky top-0 z-20"
          style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}>
          <button onClick={() => navigate({ to: "/home" })} className="p-1.5 -ml-1 rounded-full hover:bg-white/10" aria-label="back">
            <IconBack />
          </button>
          <Avatar name={chat.name} hue={chat.avatarHue} size={40} online={contact?.online} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{chat.name}</div>
            <div className="text-xs opacity-85">
              {chat.isGroup
                ? `${(chat.members?.length ?? 0) + 1} ${t("participants")}`
                : isTyping || chat.typing
                ? <span>{t("typing")} <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span>
                : contact?.online
                ? t("online")
                : `${t("lastSeen")} ${contact?.lastSeen ?? "—"}`}
            </div>
          </div>
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-full hover:bg-white/10" aria-label="search"><IconSearch /></button>
          <button className="p-2 rounded-full hover:bg-white/10" aria-label="call"><IconPhone /></button>
        </header>
      )}

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto chat-wallpaper px-3 py-4">
        <div className="flex justify-center mb-3">
          <span className="text-xs px-3 py-1 rounded-md bg-card text-muted-foreground shadow-sm">{t("today")}</span>
        </div>
        {searchOpen && searchQ.trim() && visibleMessages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">{t("noResults")}</div>
        )}
        <ul className="flex flex-col gap-1.5">
          {visibleMessages.map((m, i) => {
            const prev = visibleMessages[i - 1];
            const grouped = prev && prev.fromMe === m.fromMe;
            return (
              <Bubble key={m.id} msg={m} grouped={!!grouped} selected={selectedId === m.id}
                onSelect={() => setSelectedId((cur) => cur === m.id ? null : m.id)}
                hasSelection={!!selectedId} />
            );
          })}
          {isTyping && (
            <li className="flex justify-start anim-fade">
              <div className="rounded-xl px-3 py-2 shadow-sm bubble-tail-in"
                style={{ background: "var(--color-bubble-in)", color: "var(--color-bubble-in-foreground)" }}>
                <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="mx-2 mt-2 -mb-1 flex items-stretch gap-2 bg-muted/70 rounded-lg overflow-hidden anim-fade">
          <span className="w-1 bg-primary"/>
          <div className="flex-1 py-1.5 min-w-0">
            <div className="text-xs font-semibold text-primary">{replyTo.fromMe ? "You" : chat.name}</div>
            <div className="text-xs text-muted-foreground truncate">{replyTo.text || `[${replyTo.kind}]`}</div>
          </div>
          <button onClick={() => setReplyTo(null)} className="px-3 text-muted-foreground" aria-label="cancel">✕</button>
        </div>
      )}

      {/* Composer */}
      <div className="px-2 py-2 flex items-end gap-2 border-t border-border bg-background relative">
        {showAttach && (
          <div className="absolute bottom-16 left-3 right-3 bg-popover rounded-2xl shadow-xl p-4 grid grid-cols-3 gap-3 border border-border z-10 anim-pop">
            <AttachBtn label={t("photo")} color="#bf59cf" onClick={() => sendAttachment("photo")}><IconPhotoWhite /></AttachBtn>
            <AttachBtn label={t("video")} color="#f76454" onClick={() => sendAttachment("video")}><IconVideoWhite /></AttachBtn>
            <AttachBtn label={t("voice")} color="#f4a93d" onClick={() => sendAttachment("voice")}><IconMicWhite /></AttachBtn>
          </div>
        )}
        {showEmoji && (
          <div className="absolute bottom-16 left-2 right-2 bg-popover rounded-2xl shadow-xl p-3 border border-border z-10 anim-pop">
            <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => { setDraft((d) => d + e); }} className="text-2xl rounded hover:bg-muted aspect-square">{e}</button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 bg-input rounded-full flex items-center px-3 py-2 gap-2">
          <button onClick={() => { setShowEmoji((v) => !v); setShowAttach(false); }} className="text-muted-foreground" aria-label="emoji">
            <IconEmoji />
          </button>
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            onFocus={() => { setShowEmoji(false); setShowAttach(false); }}
            placeholder={t("typeMessage")}
            className="flex-1 bg-transparent outline-none text-sm py-1" />
          <button onClick={() => { setShowAttach((v) => !v); setShowEmoji(false); }} className="text-muted-foreground" aria-label="attach">
            <IconClip />
          </button>
        </div>
        <button onClick={draft.trim() ? send : () => sendAttachment("voice")}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 transition-transform active:scale-95"
          style={{ background: "var(--color-primary)" }}
          aria-label={draft.trim() ? t("send") : t("voice")}>
          {draft.trim() ? <IconSend /> : <IconMic />}
        </button>
      </div>

      {/* Forward modal */}
      {forwardMsg && (
        <Modal onClose={() => setForwardMsg(null)} title={t("forwardTo")}>
          <ul className="max-h-80 overflow-y-auto">
            {allChats.filter((c) => c.id !== chat.id).map((c) => (
              <li key={c.id}>
                <button onClick={() => doForward(c.id)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted text-left">
                  <Avatar name={c.name} hue={c.avatarHue} size={42} />
                  <span className="font-medium">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteMsg && (
        <Modal onClose={() => setDeleteMsg(null)} title={t("deleteMsg")}>
          <div className="flex flex-col gap-2 pt-1">
            <button onClick={() => doDelete(false)} className="py-3 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium">{t("deleteForMe")}</button>
            {deleteMsg.fromMe && (
              <button onClick={() => doDelete(true)} className="py-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/15 text-sm font-medium">{t("deleteForEveryone")}</button>
            )}
            <button onClick={() => setDeleteMsg(null)} className="py-3 rounded-lg text-sm">{t("cancel")}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 anim-fade" onClick={onClose}>
      <div className="bg-popover text-popover-foreground w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 border border-border anim-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold mb-3">{title}</div>
        {children}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button onClick={onClick} className="p-2 rounded-full hover:bg-white/10" aria-label={label}>{children}</button>;
}

function AttachBtn({ children, color, label, onClick }: { children: React.ReactNode; color: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: color }}>{children}</span>
      <span className="text-xs text-foreground">{label}</span>
    </button>
  );
}

function Bubble({ msg, grouped, selected, onSelect, hasSelection }: { msg: XMessage; grouped: boolean; selected: boolean; onSelect: () => void; hasSelection: boolean }) {
  const isOut = msg.fromMe;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPress = () => {
    pressTimer.current = setTimeout(onSelect, 400);
  };
  const cancelPress = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };
  const handleClick = () => {
    if (hasSelection) onSelect();
  };

  return (
    <li className={`flex ${isOut ? "justify-end" : "justify-start"} ${selected ? "bg-primary/10 -mx-3 px-3 py-0.5 rounded" : ""}`}>
      <div
        onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
        onTouchStart={startPress} onTouchEnd={cancelPress} onTouchMove={cancelPress}
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); onSelect(); }}
        className={`relative max-w-[78%] rounded-xl px-2.5 pt-1.5 pb-1 shadow-sm cursor-pointer ${grouped ? "" : isOut ? "bubble-tail-out" : "bubble-tail-in"} ${msg.isNew ? (isOut ? "anim-bubble-out" : "anim-bubble-in") : ""}`}
        style={{
          background: isOut ? "var(--color-bubble-out)" : "var(--color-bubble-in)",
          color: isOut ? "var(--color-bubble-out-foreground)" : "var(--color-bubble-in-foreground)",
          borderTopRightRadius: isOut && !grouped ? 4 : undefined,
          borderTopLeftRadius: !isOut && !grouped ? 4 : undefined,
        }}
      >
        {msg.replyToText && !msg.deleted && (
          <div className="flex items-stretch gap-2 mb-1 -mt-0.5 rounded-md overflow-hidden" style={{ background: "color-mix(in oklab, currentColor 10%, transparent)" }}>
            <span className="w-1" style={{ background: "var(--color-primary)" }}/>
            <div className="py-1 pr-2 min-w-0 flex-1">
              <div className="text-[11px] font-semibold opacity-80">{msg.replyToFromMe ? "You" : "Them"}</div>
              <div className="text-xs opacity-80 truncate">{msg.replyToText}</div>
            </div>
          </div>
        )}

        {msg.deleted ? (
          <p className="text-sm italic opacity-70 pr-12">🚫 {msg.fromMe ? "You deleted this message" : "This message was deleted"}</p>
        ) : (
          <>
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
          </>
        )}

        <div className="flex items-center justify-end gap-1 -mt-0.5">
          {msg.starred && <IconStar filled small />}
          <span className="text-[10px] opacity-70">{msg.time}</span>
          {isOut && !msg.deleted && <Ticks status={msg.status} />}
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

/* Icons */
function IconBack() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>; }
function IconClose() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>; }
function IconSearch() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5" strokeLinecap="round"/></svg>; }
function IconPhone() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.9.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.4.2 2.7.6 3.9.1.4 0 .8-.3 1.1l-2.2 2.1Z"/></svg>; }
function IconReply() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17l-5-5 5-5"/><path d="M4 12h9a7 7 0 0 1 7 7v1"/></svg>; }
function IconForward() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5"/><path d="M20 12h-9a7 7 0 0 0-7 7v1"/></svg>; }
function IconCopy() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>; }
function IconTrash() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>; }
function IconStar({ filled, small }: { filled?: boolean; small?: boolean }) {
  const s = small ? 12 : 20;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>;
}
function IconEmoji() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.5 2 4 2s3-.5 4-2"/><circle cx="9" cy="10" r="0.8" fill="currentColor"/><circle cx="15" cy="10" r="0.8" fill="currentColor"/></svg>; }
function IconClip() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.5L13 20.5a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 1 1 5 5L11.5 18a2 2 0 0 1-3-3l7-7"/></svg>; }
function IconSend() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l13 2-13 2v6Z"/></svg>; }
function IconMic() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z"/></svg>; }
function IconPhotoWhite() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 13.5l2.5 3 3.5-4.5L19 18H5l3.5-4.5Z"/></svg>; }
function IconVideoWhite() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 4v-11l-5 4Z"/></svg>; }
function IconMicWhite() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z"/></svg>; }
