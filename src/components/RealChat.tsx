import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { Ticks } from "@/components/Ticks";
import {
  fetchThread,
  sendDbMessage,
  uploadAttachment,
  attachmentUrl,
  markThreadRead,
  hideMessageForMe,
  deleteForEveryone,
  isBlockedByMe,
  blockUser,
  unblockUser,
  reportUser,
  previewOf,
  type DbMessage,
} from "@/lib/chat-db";
import { fetchReactions, setReaction, removeReaction, type Reaction, fetchPins, pinMessage, unpinMessage, type Pin } from "@/lib/chat-db";
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
import { useI18n } from "@/lib/i18n";
import { getChatProfile } from "@/lib/profile-lookup.functions";
import { useContactNames } from "@/lib/contact-names";
import { notifyNewMessage } from "@/lib/push.functions";
import { useIsOnline } from "@/lib/presence";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function lastSeenText(iso: string | null, hi: boolean) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  const t = timeOf(iso);
  if (hi) return today ? `आखिरी बार आज ${t} बजे देखा` : `आखिरी बार ${d.toLocaleDateString()} ${t} देखा`;
  return today ? `last seen today at ${t}` : `last seen ${d.toLocaleDateString()} at ${t}`;
}

function Attachment({ m }: { m: DbMessage }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (m.attachment_path) void attachmentUrl(m.attachment_path).then(setUrl);
  }, [m.attachment_path]);
  if (!m.attachment_path) return null;
  if (m.attachment_type?.startsWith("image/")) {
    return url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block mb-1">
        <img src={url} alt={m.attachment_name ?? "photo"} className="rounded-xl max-h-72 w-full object-cover" />
      </a>
    ) : (
      <div className="w-56 h-40 rounded-xl bg-muted animate-pulse mb-1" />
    );
  }
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      download={m.attachment_name ?? undefined}
      className="flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2 mb-1 min-w-48"
    >
      <span className="text-2xl">{m.attachment_type === "application/pdf" ? "📕" : "📄"}</span>
      <span className="text-xs font-medium truncate flex-1">{m.attachment_name}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" /></svg>
    </a>
  );
}

export function RealChat({ peerId }: { peerId: string }) {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const hi = lang === "hi";
  const navigate = useNavigate();
  const fetchChatProfile = useServerFn(getChatProfile);
  const pushNewMessage = useServerFn(notifyNewMessage);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [peerName, setPeerName] = useState("Chat");
  const [peerAvatar, setPeerAvatar] = useState<string | null>(null);
  const [peerAbout, setPeerAbout] = useState<string | null>(null);
  const [peerLastSeen, setPeerLastSeen] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [actionMsg, setActionMsg] = useState<DbMessage | null>(null);
  const [replyTo, setReplyTo] = useState<DbMessage | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const { displayName, setContactName: saveContactName } = useContactNames();
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannel = useRef<RealtimeChannel | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const online = useIsOnline(peerId);

  const L = useMemo(
    () => ({
      placeholder: hi ? "संदेश लिखें" : "Type a message",
      empty: hi ? "अभी कोई संदेश नहीं" : "No messages yet — say hello 👋",
      online: hi ? "ऑनलाइन" : "online",
      typing: hi ? "टाइप कर रहे हैं…" : "typing…",
      reply: hi ? "जवाब दें" : "Reply",
      delMe: hi ? "मेरे लिए हटाएँ" : "Delete for me",
      delAll: hi ? "सबके लिए हटाएँ" : "Delete for everyone",
      deleted: hi ? "🚫 यह संदेश हटा दिया गया" : "🚫 This message was deleted",
      cancel: hi ? "रद्द करें" : "Cancel",
      rename: hi ? "नाम बदलें" : "Edit contact name",
      renameHint: hi ? "यह नाम सिर्फ़ आपको दिखेगा" : "This name is only visible to you",
      save: hi ? "सहेजें" : "Save",
      you: hi ? "आप" : "You",
      block: hi ? "ब्लॉक करें" : "Block",
      unblock: hi ? "अनब्लॉक करें" : "Unblock",
      report: hi ? "रिपोर्ट करें" : "Report",
      info: hi ? "संपर्क जानकारी" : "Contact info",
      about: hi ? "अबाउट" : "About",
      blockedBar: hi ? "आपने इस संपर्क को ब्लॉक किया है" : "You blocked this contact",
      reportTitle: hi ? "रिपोर्ट का कारण चुनें" : "Why are you reporting?",
      reported: hi ? "रिपोर्ट भेज दी गई" : "Report sent",
      cantSend: hi ? "संदेश नहीं भेजा जा सका" : "Message couldn't be sent",
      tooBig: hi ? "फ़ाइल 20MB से छोटी होनी चाहिए" : "File must be under 20MB",
      attach: hi ? "फ़ाइल भेजें" : "Attach file",
    }),
    [hi],
  );

  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let active = true;
    (async () => {
      const [prof, thread, isBlocked] = await Promise.all([
        fetchChatProfile({ data: { profileId: peerId } }),
        fetchThread(user.id, peerId),
        isBlockedByMe(peerId),
      ]);
      if (!active) return;
      setPeerName(prof?.username || "Chat");
      setPeerAvatar(prof?.avatar_url ?? null);
      setPeerAbout(prof?.about ?? null);
      setPeerLastSeen(prof?.last_seen ?? null);
      setBlocked(isBlocked);
      setMessages(thread);
      fetchReactions(thread.map((m) => m.id)).then((r) => active && setReactions(r));
      fetchPins(thread.map((m) => m.id)).then((p) => active && setPins(p));
      setReady(true);
      void markThreadRead(user.id, peerId);
    })();

    const inThread = (m: DbMessage) =>
      (m.sender_id === user.id && m.receiver_id === peerId) || (m.sender_id === peerId && m.receiver_id === user.id);

    const channel = supabase
      .channel(`messages-${peerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as DbMessage;
        if (!inThread(m)) return;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (m.sender_id === peerId) {
          setPeerTyping(false);
          if (document.visibilityState === "visible") void markThreadRead(user.id, peerId);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as DbMessage;
        if (!inThread(m)) return;
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
        const old = payload.old as { id?: string };
        if (old?.id) setMessages((prev) => prev.filter((x) => x.id !== old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_pins" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const o = payload.old as Partial<Pin>;
          if (o?.message_id) setPins((prev) => prev.filter((p) => p.message_id !== o.message_id));
        } else {
          const n = payload.new as Pin;
          setPins((prev) => (prev.some((p) => p.message_id === n.message_id) ? prev : [...prev, n]));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, (payload) => {
        const n = payload.new as Partial<Reaction>;
        const o = payload.old as Partial<Reaction>;
        setReactions((prev) => {
          let next = prev;
          if (o?.message_id && o.user_id) next = next.filter((r) => !(r.message_id === o.message_id && r.user_id === o.user_id));
          if (payload.eventType !== "DELETE" && n?.message_id && n.user_id && n.emoji) {
            next = next.filter((r) => !(r.message_id === n.message_id && r.user_id === n.user_id));
            next = [...next, n as Reaction];
          }
          return next;
        });
      })
      .subscribe();

    // Typing indicator over a broadcast channel shared by both participants.
    const room = [user.id, peerId].sort().join("_");
    const tc = supabase
      .channel(`typing-${room}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from !== peerId) return;
        setPeerTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setPeerTyping(false), 3000);
      })
      .subscribe();
    typingChannel.current = tc;

    const onVis = () => {
      if (document.visibilityState === "visible") void markThreadRead(user.id, peerId);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVis);
      void supabase.removeChannel(channel);
      void supabase.removeChannel(tc);
      typingChannel.current = null;
    };
  }, [user, loading, peerId, navigate, fetchChatProfile]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages.length, peerTyping]);

  const onDraftChange = (v: string) => {
    setDraft(v);
    const now = Date.now();
    if (user && v && now - lastTypingSent.current > 1500) {
      lastTypingSent.current = now;
      void typingChannel.current?.send({ type: "broadcast", event: "typing", payload: { from: user.id } });
    }
  };

  const afterSend = async (data: unknown, pushText: string) => {
    if (data) {
      const m = data as DbMessage;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    }
    try {
      await pushNewMessage({ data: { receiverId: peerId, text: pushText } });
    } catch (err) {
      console.error("Push notification failed", err);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !user || blocked) return;
    setDraft("");
    const reply = replyTo;
    setReplyTo(null);
    const { data, error } = await sendDbMessage(user.id, peerId, text, { reply_to_id: reply?.id ?? null });
    if (error) {
      setSendError(L.cantSend);
      setTimeout(() => setSendError(null), 2500);
      return;
    }
    await afterSend(data, text);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || blocked) return;
    if (file.size > 20 * 1024 * 1024) return flash(L.tooBig);
    setUploading(true);
    try {
      const path = await uploadAttachment(user.id, file);
      const caption = draft.trim();
      setDraft("");
      const reply = replyTo;
      setReplyTo(null);
      const { data, error } = await sendDbMessage(user.id, peerId, caption, {
        reply_to_id: reply?.id ?? null,
        attachment_path: path,
        attachment_name: file.name,
        attachment_type: file.type || "application/octet-stream",
      });
      if (error) throw error;
      await afterSend(data, file.type.startsWith("image/") ? "📷 Photo" : `📄 ${file.name}`);
    } catch (err) {
      console.error("Upload failed", err);
      flash(L.cantSend);
    } finally {
      setUploading(false);
    }
  };

  const startPress = (m: DbMessage) => {
    pressTimer.current = setTimeout(() => setActionMsg(m), 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const shownName = displayName(peerId, peerName);
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const pinnedMsgs = useMemo(
    () => pins
      .map((p) => ({ pin: p, msg: byId.get(p.message_id) }))
      .filter((x): x is { pin: Pin; msg: DbMessage } => !!x.msg && !x.msg.deleted_for_everyone)
      .sort((a, b) => b.pin.created_at.localeCompare(a.pin.created_at)),
    [pins, byId],
  );
  const isPinned = (id: string) => pins.some((p) => p.message_id === id);
  const togglePin = async (id: string) => {
    if (!user) return;
    if (isPinned(id)) {
      setPins((prev) => prev.filter((p) => p.message_id !== id));
      await unpinMessage(id);
    } else {
      setPins((prev) => [...prev, { message_id: id, pinned_by: user.id, created_at: new Date().toISOString() }]);
      const { error } = await pinMessage(id);
      if (error) setPins((prev) => prev.filter((p) => p.message_id !== id));
    }
  };
  const jumpTo = (id: string) => {
    setPinsOpen(false);
    document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    setTimeout(() => setHighlightId((h) => (h === id ? null : h)), 1800);
  };

  const reactionsOf = (id: string) => reactions.filter((r) => r.message_id === id);
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const mine = reactions.find((r) => r.message_id === messageId && r.user_id === user.id);
    const others = reactions.filter((r) => !(r.message_id === messageId && r.user_id === user.id));
    if (mine?.emoji === emoji) {
      setReactions(others);
      await removeReaction(messageId, user.id);
    } else {
      setReactions([...others, { message_id: messageId, user_id: user.id, emoji }]);
      await setReaction(messageId, user.id, emoji);
    }
  };

  const doDeleteForMe = async () => {
    if (!actionMsg) return;
    const id = actionMsg.id;
    setActionMsg(null);
    setMessages((prev) => prev.filter((x) => x.id !== id));
    await hideMessageForMe(id);
  };
  const doDeleteForAll = async () => {
    if (!actionMsg) return;
    const id = actionMsg.id;
    setActionMsg(null);
    setMessages((prev) =>
      prev.map((x) => (x.id === id ? { ...x, deleted_for_everyone: true, message_text: "", attachment_path: null } : x)),
    );
    await deleteForEveryone(id);
  };

  const toggleBlock = async () => {
    setMenuOpen(false);
    if (blocked) {
      await unblockUser(peerId);
      setBlocked(false);
    } else {
      await blockUser(peerId);
      setBlocked(true);
    }
  };

  const submitReport = async (reason: string) => {
    setReporting(false);
    await reportUser(peerId, reason);
    flash(L.reported);
  };

  const status = peerTyping ? L.typing : online ? L.online : lastSeenText(peerLastSeen, hi);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "var(--color-chat-bg)" }}>
      <header
        className="px-2 py-2 flex items-center gap-2 z-20 shrink-0"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/home" })} className="p-1.5 rounded-full hover:bg-white/10 press" aria-label="back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button onClick={() => setShowInfo(true)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <Avatar name={shownName} hue={200} size={38} src={peerAvatar} online={online} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-tight truncate">{shownName}</div>
            <div className="text-[11px] opacity-80 truncate">{status}</div>
          </div>
        </button>
        <button
          onClick={() => {
            setNameDraft(shownName);
            setRenaming(true);
          }}
          className="p-2 rounded-full hover:bg-white/10 press"
          aria-label={L.rename}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-full hover:bg-white/10 press" aria-label="menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 w-48 rounded-xl bg-card text-foreground border border-border shadow-xl overflow-hidden anim-pop z-30">
              <button onClick={() => { setMenuOpen(false); setShowInfo(true); }} className="w-full text-left px-4 py-3 text-sm hover:bg-muted/60">{L.info}</button>
              <button onClick={() => void toggleBlock()} className="w-full text-left px-4 py-3 text-sm hover:bg-muted/60">{blocked ? L.unblock : L.block}</button>
              <button onClick={() => { setMenuOpen(false); setReporting(true); }} className="w-full text-left px-4 py-3 text-sm text-destructive hover:bg-muted/60">{L.report}</button>
            </div>
          )}
        </div>
      </header>

      {pinnedMsgs.length > 0 && (
        <button
          onClick={() => (pinnedMsgs.length === 1 ? jumpTo(pinnedMsgs[0].msg.id) : setPinsOpen(true))}
          className="shrink-0 flex items-center gap-2 px-3 py-2 bg-card border-b border-border text-left press"
        >
          <span className="text-base">📌</span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-primary">
              {hi ? "पिन किए गए संदेश" : "Pinned messages"}{pinnedMsgs.length > 1 ? ` (${pinnedMsgs.length})` : ""}
            </div>
            <div className="truncate text-xs text-muted-foreground">{previewOf(pinnedMsgs[0].msg)}</div>
          </div>
        </button>
      )}

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" onClick={() => setMenuOpen(false)}>
        {ready && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">{L.empty}</p>
        )}
        {messages.map((m) => {
          const fromMe = m.sender_id === user?.id;
          const quoted = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
          return (
            <div key={m.id} id={`msg-${m.id}`} className={`flex rounded-xl transition-colors duration-500 ${highlightId === m.id ? "bg-primary/15" : ""} ${fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm anim-bubble select-none ${fromMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
                style={{
                  background: fromMe ? "var(--color-bubble-out)" : "var(--color-bubble-in)",
                  color: "var(--color-foreground)",
                }}
                onPointerDown={() => !m.deleted_for_everyone && startPress(m)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!m.deleted_for_everyone) setActionMsg(m);
                }}
              >
                {m.deleted_for_everyone ? (
                  <span className="italic text-muted-foreground">{L.deleted}</span>
                ) : (
                  <>
                    {quoted && (
                      <div className="mb-1 rounded-lg bg-black/5 border-l-4 border-primary px-2 py-1 text-xs">
                        <div className="font-semibold text-primary">{quoted.sender_id === user?.id ? L.you : shownName}</div>
                        <div className="truncate text-muted-foreground">{previewOf(quoted)}</div>
                      </div>
                    )}
                    <Attachment m={m} />
                    {m.message_text && <span className="whitespace-pre-wrap break-words">{m.message_text}</span>}
                  </>
                )}
                <span className="ml-2 inline-flex items-center gap-1 align-bottom text-[10px] text-muted-foreground">
                  {isPinned(m.id) && !m.deleted_for_everyone && <span aria-label="pinned">📌</span>}
                  {timeOf(m.created_at)}
                  {fromMe && !m.deleted_for_everyone && <Ticks status={m.read_at ? "seen" : "delivered"} />}
                </span>
                {!m.deleted_for_everyone && reactionsOf(m.id).length > 0 && (
                  <div className={`-mb-4 mt-1 flex ${fromMe ? "justify-end" : "justify-start"}`}>
                    <button
                      onClick={() => setActionMsg(m)}
                      className="inline-flex items-center gap-0.5 rounded-full bg-card border border-border px-1.5 py-0.5 text-xs shadow-sm anim-pop"
                    >
                      {[...new Set(reactionsOf(m.id).map((r) => r.emoji))].join("")}
                      {reactionsOf(m.id).length > 1 && <span className="text-[10px] text-muted-foreground ml-0.5">{reactionsOf(m.id).length}</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {peerTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-xs italic text-muted-foreground shadow-sm anim-bubble" style={{ background: "var(--color-bubble-in)" }}>
              {L.typing}
            </div>
          </div>
        )}
      </div>

      {sendError && <div className="text-center text-xs text-destructive pb-1">{sendError}</div>}

      {blocked ? (
        <button onClick={() => void toggleBlock()} className="shrink-0 py-4 text-sm text-center bg-card border-t border-border">
          {L.blockedBar} · <span className="text-primary font-semibold">{L.unblock}</span>
        </button>
      ) : (
        <div className="shrink-0 px-2 py-2" style={{ background: "var(--color-chat-bg)" }}>
          {replyTo && (
            <div className="mx-1 mb-1 flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2 anim-slide-up">
              <div className="flex-1 min-w-0 border-l-4 border-primary pl-2">
                <div className="text-xs font-semibold text-primary">{replyTo.sender_id === user?.id ? L.you : shownName}</div>
                <div className="text-xs truncate text-muted-foreground">{previewOf(replyTo)}</div>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 text-muted-foreground" aria-label={L.cancel}>✕</button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 flex items-center bg-card rounded-full px-3 py-2 shadow-sm border border-border gap-2">
              <input
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void send()}
                placeholder={L.placeholder}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-muted-foreground press disabled:opacity-50" aria-label={L.attach}>
                {uploading ? (
                  <span className="block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></svg>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                onChange={(e) => void onPickFile(e)}
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
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-foreground text-background text-xs px-4 py-2 shadow anim-pop">{toast}</div>
      )}

      {pinsOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 anim-fade" onClick={() => setPinsOpen(false)}>
          <div className="w-full max-w-sm m-3 max-h-[70dvh] flex flex-col rounded-2xl bg-card border border-border shadow-xl overflow-hidden anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 text-sm font-semibold border-b border-border">📌 {hi ? "पिन किए गए संदेश" : "Pinned messages"}</div>
            <div className="overflow-y-auto">
              {pinnedMsgs.map(({ msg }) => (
                <div key={msg.id} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-b-0">
                  <button onClick={() => jumpTo(msg.id)} className="min-w-0 flex-1 text-left press">
                    <div className="text-[11px] font-semibold text-primary">
                      {msg.sender_id === user?.id ? L.you : shownName} · {timeOf(msg.created_at)}
                    </div>
                    <div className="truncate text-sm">{previewOf(msg)}</div>
                  </button>
                  <button onClick={() => void togglePin(msg.id)} className="text-xs text-muted-foreground px-2 py-1 press">
                    {hi ? "अनपिन" : "Unpin"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {actionMsg && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 anim-fade" onClick={() => setActionMsg(null)}>
          <div className="w-full max-w-sm m-3 rounded-2xl bg-card border border-border shadow-xl overflow-hidden anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-around px-2 py-3 border-b border-border">
              {REACTION_EMOJIS.map((e) => {
                const active = reactions.some((r) => r.message_id === actionMsg.id && r.user_id === user?.id && r.emoji === e);
                return (
                  <button
                    key={e}
                    onClick={() => { void toggleReaction(actionMsg.id, e); setActionMsg(null); }}
                    className={`text-2xl rounded-full w-11 h-11 press ${active ? "bg-primary/15" : ""}`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setReplyTo(actionMsg); setActionMsg(null); }}
              className="w-full px-4 py-3.5 text-sm font-semibold hover:bg-muted/60 press"
            >
              ↩ {L.reply}
            </button>
            <button
              onClick={() => { void togglePin(actionMsg.id); setActionMsg(null); }}
              className="w-full px-4 py-3.5 text-sm font-semibold hover:bg-muted/60 press border-t border-border"
            >
              📌 {isPinned(actionMsg.id) ? (hi ? "अनपिन करें" : "Unpin") : (hi ? "पिन करें" : "Pin")}
            </button>
            <button onClick={() => void doDeleteForMe()} className="w-full px-4 py-3.5 text-sm text-destructive hover:bg-muted/60 press border-t border-border">
              {L.delMe}
            </button>
            {actionMsg.sender_id === user?.id && (
              <button onClick={() => void doDeleteForAll()} className="w-full px-4 py-3.5 text-sm font-semibold text-destructive hover:bg-muted/60 press border-t border-border">
                {L.delAll}
              </button>
            )}
            <button onClick={() => setActionMsg(null)} className="w-full px-4 py-3.5 text-sm hover:bg-muted/60 press border-t border-border">
              {L.cancel}
            </button>
          </div>
        </div>
      )}

      {reporting && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 anim-fade" onClick={() => setReporting(false)}>
          <div className="w-full max-w-sm m-3 rounded-2xl bg-card border border-border shadow-xl overflow-hidden anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 font-semibold text-sm">{L.reportTitle}</div>
            {(hi ? ["स्पैम", "उत्पीड़न", "अनुचित सामग्री", "नकली अकाउंट"] : ["Spam", "Harassment", "Inappropriate content", "Fake account"]).map((r) => (
              <button key={r} onClick={() => void submitReport(r)} className="w-full text-left px-4 py-3 text-sm hover:bg-muted/60 border-t border-border">{r}</button>
            ))}
            <button onClick={() => setReporting(false)} className="w-full px-4 py-3.5 text-sm hover:bg-muted/60 border-t border-border">{L.cancel}</button>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 anim-fade" onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-sm m-3 rounded-2xl bg-card border border-border shadow-xl p-5 anim-slide-up flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <Avatar name={shownName} hue={200} size={96} src={peerAvatar} online={online} />
            <div className="mt-3 font-semibold text-lg">{shownName}</div>
            <div className="text-xs text-muted-foreground">{online ? L.online : lastSeenText(peerLastSeen, hi)}</div>
            <div className="w-full mt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{L.about}</div>
              <div className="text-sm mt-1">{peerAbout || "Hey there! I am using ChatWave."}</div>
            </div>
            <div className="w-full flex gap-2 mt-5">
              <button onClick={() => { setShowInfo(false); void toggleBlock(); }} className="flex-1 py-2.5 rounded-full text-sm border border-border press">{blocked ? L.unblock : L.block}</button>
              <button onClick={() => { setShowInfo(false); setReporting(true); }} className="flex-1 py-2.5 rounded-full text-sm border border-destructive text-destructive press">{L.report}</button>
            </div>
          </div>
        </div>
      )}

      {renaming && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 anim-fade" onClick={() => setRenaming(false)}>
          <div className="w-full max-w-sm m-3 rounded-2xl bg-card border border-border shadow-xl p-4 anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold mb-1">{L.rename}</div>
            <p className="text-xs text-muted-foreground mb-3">{L.renameHint}</p>
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setRenaming(false)} className="flex-1 py-2.5 rounded-full text-sm border border-border press">{L.cancel}</button>
              <button
                onClick={() => { saveContactName(peerId, nameDraft); setRenaming(false); }}
                className="flex-1 py-2.5 rounded-full text-sm text-white font-semibold shadow press"
                style={{ background: "var(--color-primary)" }}
              >
                {L.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
