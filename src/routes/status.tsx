import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/status")({ component: StatusPage });

type StoryItem = {
  id: string;
  src: string;
  kind: "image" | "video";
  caption: string;
  createdAt: number;
};

const KEY = "cw_my_stories";

function loadStories(): StoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function saveStories(list: StoryItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function StatusPage() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [pending, setPending] = useState<{ src: string; kind: "image" | "video" } | null>(null);
  const [caption, setCaption] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setStories(loadStories());
    // Auto-open picker on first mount
    const t = setTimeout(() => fileRef.current?.click(), 150);
    return () => clearTimeout(t);
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPending({ src: reader.result, kind });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const publish = () => {
    if (!pending) return;
    const next: StoryItem = {
      id: "s" + Date.now(),
      src: pending.src,
      kind: pending.kind,
      caption: caption.trim(),
      createdAt: Date.now(),
    };
    const updated = [next, ...stories];
    setStories(updated);
    saveStories(updated);
    setPending(null);
    setCaption("");
    setToast(lang === "hi" ? "स्टेटस लग गया" : "Status posted");
    setTimeout(() => setToast(null), 1400);
  };

  const remove = (id: string) => {
    const updated = stories.filter((s) => s.id !== id);
    setStories(updated);
    saveStories(updated);
  };

  const L = {
    title: lang === "hi" ? "मेरा स्टेटस" : "My status",
    pick: lang === "hi" ? "गैलरी से चुनें" : "Pick from gallery",
    addNew: lang === "hi" ? "नया स्टेटस जोड़ें" : "Add new status",
    captionPh: lang === "hi" ? "कैप्शन जोड़ें…" : "Add a caption…",
    post: lang === "hi" ? "पोस्ट करें" : "Post",
    cancel: lang === "hi" ? "रद्द करें" : "Cancel",
    empty: lang === "hi" ? "अभी कोई स्टेटस नहीं।" : "No status updates yet.",
    recent: lang === "hi" ? "हाल के अपडेट" : "Recent updates",
    delete: lang === "hi" ? "हटाएँ" : "Delete",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header
        className="px-3 py-3 flex items-center gap-3 sticky top-0 z-20"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/home" })} className="p-1.5 -ml-1 rounded-full hover:bg-white/10 press" aria-label="back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="font-semibold text-lg flex-1">{L.title}</div>
      </header>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg anim-pop"
          style={{ background: "var(--color-primary)" }}>
          ✓ {toast}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onPick}
      />

      <div className="px-4 py-5">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-white shadow-lg press hover-lift"
          style={{ background: "var(--color-primary)" }}
        >
          <span className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">📷</span>
          <div className="text-left">
            <div className="font-semibold">{L.addNew}</div>
            <div className="text-xs opacity-90">{L.pick}</div>
          </div>
        </button>
      </div>

      {stories.length === 0 && !pending && (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">{L.empty}</div>
      )}

      {stories.length > 0 && (
        <>
          <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{L.recent}</div>
          <ul className="grid grid-cols-3 gap-1.5 px-1.5">
            {stories.map((s) => (
              <li key={s.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted anim-pop">
                {s.kind === "image" ? (
                  <img src={s.src} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={s.src} className="w-full h-full object-cover" muted playsInline />
                )}
                {s.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-1.5 text-[11px] text-white bg-gradient-to-t from-black/70 to-transparent truncate">
                    {s.caption}
                  </div>
                )}
                <button
                  onClick={() => remove(s.id)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs press"
                  aria-label={L.delete}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {pending && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col anim-page">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <button onClick={() => { setPending(null); setCaption(""); }} className="p-2 rounded-full hover:bg-white/10 press" aria-label="close">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm font-semibold press px-3 py-1.5 rounded-full bg-white/10"
            >
              {L.pick}
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            {pending.kind === "image" ? (
              <img src={pending.src} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
            ) : (
              <video src={pending.src} controls autoPlay className="max-h-full max-w-full rounded-lg" />
            )}
          </div>
          <div className="p-3 flex items-center gap-2 bg-black/80">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={L.captionPh}
              className="flex-1 bg-white/10 text-white placeholder:text-white/60 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={publish}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg press"
              style={{ background: "var(--color-primary)" }}
              aria-label={L.post}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
