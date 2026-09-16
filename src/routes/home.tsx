import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { chats, stories, calls } from "@/lib/mock-data";
import { Avatar } from "@/components/Avatar";
import { Ticks } from "@/components/Ticks";
import { useAuth } from "@/lib/auth";
import { fetchConversations, deleteConversation, type Conversation } from "@/lib/chat-db";
import { supabase } from "@/integrations/supabase/client";

type MyStory = { id: string; src: string; kind: "image" | "video"; caption: string; createdAt: number };

export const Route = createFileRoute("/home")({
  component: Home,
});

type Tab = "chats" | "status" | "calls";

function Home() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("chats");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [deletingPeer, setDeletingPeer] = useState<Conversation | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPress = (c: Conversation) => {
    pressTimer.current = setTimeout(() => setDeletingPeer(c), 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const confirmDeleteChat = async () => {
    if (!deletingPeer || !user) return;
    const peer = deletingPeer;
    setDeletingPeer(null);
    setConvos((prev) => prev.filter((c) => c.peerId !== peer.peerId));
    await deleteConversation(user.id, peer.peerId);
  };

  useEffect(() => {
    if (!user) { setConvos([]); return; }
    let active = true;
    const load = () => fetchConversations(user.id).then((c) => { if (active) setConvos(c); });
    void load();
    const channel = supabase
      .channel("home-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void load())
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    try { setMyStories(JSON.parse(localStorage.getItem("cw_my_stories") || "[]")); } catch { /* ignore */ }
  }, [tab]);

  const latestMine = myStories[0];

  const filtered = useMemo(() => {
    if (!q.trim()) return chats;
    const s = q.toLowerCase();
    return chats.filter(
      (c) => c.name.toLowerCase().includes(s) || c.lastMessage.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      {/* Header */}
      <header
        className="px-4 pt-3 pb-2 sticky top-0 z-20"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">{t("appName")}</h1>
          <div className="flex items-center gap-1 relative">
            <button className="p-2 rounded-full hover:bg-white/10 press" onClick={() => setSearchOpen((v) => !v)} aria-label="search">
              <SearchIcon />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 press" onClick={() => setMenuOpen((v) => !v)} aria-label="menu">
              <DotsIcon />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 bg-popover text-popover-foreground shadow-lg rounded-lg py-2 min-w-44 z-30 border border-border anim-pop origin-top-right">
                <Link to="/new-group" className="block px-4 py-2 text-sm hover:bg-muted press" onClick={() => setMenuOpen(false)}>
                  {t("newGroup")}
                </Link>
                <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-muted press" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-muted press" onClick={() => setMenuOpen(false)}>
                  {t("settings")}
                </Link>
                <Link to="/settings/privacy" className="block px-4 py-2 text-sm hover:bg-muted press" onClick={() => setMenuOpen(false)}>
                  {t("privacy")}
                </Link>
                <Link to="/settings/security" className="block px-4 py-2 text-sm hover:bg-muted press" onClick={() => setMenuOpen(false)}>
                  Security
                </Link>
              </div>
            )}

          </div>
        </div>

        {searchOpen && (
          <div className="bg-white/15 rounded-full flex items-center px-3 py-1.5 mb-2 anim-fade">
            <SearchIcon size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="bg-transparent outline-none px-2 py-1 text-sm flex-1 placeholder:text-white/70"
              style={{ color: "var(--color-header-foreground)" }}
            />
          </div>
        )}

        {/* Tabs */}
        <nav className="flex">
          {(["chats", "status", "calls"] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className="flex-1 py-2.5 text-sm font-semibold uppercase tracking-wide relative press"
              style={{ opacity: tab === tabKey ? 1 : 0.7, transition: "opacity 200ms ease" }}
            >
              {t(tabKey)}
              {tab === tabKey && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full anim-fade" />}
            </button>
          ))}
        </nav>

      </header>

      {/* Body */}
      {tab === "chats" && (
        <ul key="chats" className="flex-1 anim-stagger">
          {convos
            .filter((c) => !q.trim() || c.peerName.toLowerCase().includes(q.toLowerCase()) || c.lastMessage.toLowerCase().includes(q.toLowerCase()))
            .map((c) => (
              <li
                key={c.peerId}
                onPointerDown={() => startPress(c)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setDeletingPeer(c);
                }}
              >
                <Link
                  to="/chat/$id"
                  params={{ id: c.peerId }}
                  className="flex items-center gap-3 px-4 py-3 active:bg-muted/60 hover:bg-muted/40 hover-lift press"
                >
                  <Avatar name={c.peerName} hue={200} size={52} src={c.peerAvatar} />
                  <div className="flex-1 min-w-0 border-b border-border/60 pb-3 -mb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{c.peerName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.lastAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-sm truncate text-muted-foreground mt-0.5">{c.lastMessage}</div>
                  </div>
                </Link>
              </li>
            ))}
          {user && convos.length === 0 && (
            <li className="px-4 py-4 text-center text-sm text-muted-foreground">
              No real chats yet —{" "}
              <Link to="/contacts" className="text-primary font-semibold">find someone by username</Link>.
            </li>
          )}
          {!user && (
            <li className="px-4 py-4 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-semibold">Sign in with email</Link> to chat for real.
            </li>
          )}
          {filtered.length === 0 && (
            <li className="text-center text-sm text-muted-foreground py-12">No chats found.</li>
          )}
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                to="/chat/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 px-4 py-3 active:bg-muted/60 hover:bg-muted/40 hover-lift press"
              >

                <Avatar name={c.name} hue={c.avatarHue} size={52} />
                <div className="flex-1 min-w-0 border-b border-border/60 pb-3 -mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{c.name}</span>
                    <span className={`text-xs ${c.unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {c.lastTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-sm truncate ${c.typing ? "text-primary italic" : "text-muted-foreground"}`}>
                      {c.typing ? t("typing") : c.lastMessage}
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      {c.muted && <MutedIcon />}
                      {c.pinned && <PinIcon />}
                      {c.unread > 0 && (
                        <span
                          className="text-xs font-semibold text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center"
                          style={{ background: "var(--color-unread)" }}
                        >
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {tab === "status" && (
        <div key="status" className="flex-1 anim-slide-up">

          {/* My status */}
          <button
            onClick={() => navigate({ to: "/status" })}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 hover-lift press text-left"
          >
            <div className="relative">
              {latestMine ? (
                <div
                  className="rounded-full p-[2.5px]"
                  style={{ background: "conic-gradient(var(--color-primary), var(--color-accent), var(--color-primary))" }}
                >
                  <div className="rounded-full p-[2px] bg-background">
                    {latestMine.kind === "image" ? (
                      <img src={latestMine.src} alt="" className="w-[48px] h-[48px] rounded-full object-cover" />
                    ) : (
                      <video src={latestMine.src} muted playsInline className="w-[48px] h-[48px] rounded-full object-cover" />
                    )}
                  </div>
                </div>
              ) : (
                <Avatar name={profile?.username || "You"} hue={170} size={52} src={profile?.avatar_url} />
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center text-sm font-bold border-2 border-background"
              >
                +
              </span>
            </div>
            <div>
              <div className="font-semibold">{t("myStatus")}</div>
              <div className="text-xs text-muted-foreground">
                {latestMine
                  ? `${myStories.length} update${myStories.length > 1 ? "s" : ""}${latestMine.caption ? ` · ${latestMine.caption}` : ""}`
                  : t("tapToAdd")}
              </div>
            </div>
          </button>

          <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            {t("recentUpdates")}
          </div>
          <ul className="anim-stagger">
            {stories.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => navigate({ to: "/status" })}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/40 hover-lift press"
                >
                  <div
                    className="rounded-full p-[2.5px]"
                    style={{
                      background: s.viewed
                        ? "var(--color-border)"
                        : "conic-gradient(var(--color-primary), var(--color-accent), var(--color-primary))",
                    }}
                  >
                    <div className="rounded-full p-[2px] bg-background">
                      <Avatar name={s.name} hue={s.avatarHue} size={48} />
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.time}{s.caption ? ` · ${s.caption}` : ""}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "calls" && (
        <ul key="calls" className="flex-1 anim-stagger">
          {calls.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 hover-lift">

              <Avatar name={c.name} hue={c.avatarHue} size={48} />
              <div className="flex-1 min-w-0 border-b border-border/60 pb-3 -mb-3">
                <div className={`font-semibold truncate ${c.direction === "missed" ? "text-destructive" : ""}`}>{c.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ArrowIcon direction={c.direction} />
                  <span>{c.time}</span>
                </div>
              </div>
              <button
                onClick={() => alert(`${c.type === "video" ? "Video" : "Voice"} call · ${c.name}`)}
                className="p-2 rounded-full text-primary press"
                aria-label={c.type}
              >
                {c.type === "video" ? <VideoIcon /> : <PhoneIcon />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate({ to: tab === "status" ? "/status" : tab === "calls" ? "/contacts" : "/contacts" })}
        className="fixed bottom-6 right-[calc(50%-13rem+1.5rem)] sm:right-[calc(50%-13rem+1.5rem)] w-14 h-14 rounded-2xl flex items-center justify-center text-white fab"

        style={{ background: "var(--color-primary)" }}
        aria-label="new"
      >
        {tab === "chats" && <NewChatIcon />}
        {tab === "status" && <CameraIcon />}
        {tab === "calls" && <NewChatIcon />}
      </button>

      {deletingPeer && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 anim-fade"
          onClick={() => setDeletingPeer(null)}
        >
          <div
            className="w-full max-w-sm m-3 rounded-2xl bg-card border border-border shadow-xl overflow-hidden anim-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border truncate">
              {deletingPeer.peerName}
            </div>
            <button
              onClick={() => void confirmDeleteChat()}
              className="w-full px-4 py-3.5 text-sm font-semibold text-destructive hover:bg-muted/60 press flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
              Delete chat
            </button>
            <button
              onClick={() => setDeletingPeer(null)}
              className="w-full px-4 py-3.5 text-sm hover:bg-muted/60 press border-t border-border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Icons */
function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
  );
}
function MutedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
      <path d="M9 11V8a3 3 0 1 1 6 0v3" /><rect x="5" y="11" width="14" height="10" rx="2"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
      <path d="M14 2l8 8-5 1-3 6-3-3-6 6-1-1 6-6-3-3 6-3 1-5z"/>
    </svg>
  );
}
function NewChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M16 3v6h6"/><path d="M12 8v6M9 11h6"/>
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19V8a2 2 0 0 0-2-2h-3.2l-1.4-2H7.6L6.2 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2Z"/><circle cx="12" cy="13" r="4"/></svg>
  );
}
function PhoneIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.9.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.4.2 2.7.6 3.9.1.4 0 .8-.3 1.1l-2.2 2.1Z"/></svg>;
}
function VideoIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 4v-11l-5 4Z"/></svg>;
}
function ArrowIcon({ direction }: { direction: "incoming" | "outgoing" | "missed" }) {
  const color = direction === "missed" ? "var(--color-destructive)" : "var(--color-primary)";
  const rot = direction === "outgoing" ? 0 : 180;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M7 17l10-10M17 7H8M17 7v9"/>
    </svg>
  );
}
