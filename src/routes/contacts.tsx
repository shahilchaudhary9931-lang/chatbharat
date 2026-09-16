import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Avatar } from "@/components/Avatar";
import { searchProfilesByUsername } from "@/lib/profile-lookup.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Find Contacts | ChatWave" },
      { name: "description", content: "Find registered ChatWave users by username and start a private chat." },
      { property: "og:title", content: "Find Contacts | ChatWave" },
      { property: "og:description", content: "Find registered ChatWave users by username and start a private chat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactsPage,
});

interface SearchProfile {
  id: string;
  username: string | null;
  about: string | null;
  avatar_url: string | null;
}

function ContactsPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const searchProfiles = useServerFn(searchProfilesByUsername);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  const labels = {
    title: lang === "hi" ? "संपर्क" : "Contacts",
    addContact: lang === "hi" ? "नया संपर्क" : "Add contact",
    search: lang === "hi" ? "नाम या यूज़रनेम खोजें" : "Search name or username",
    empty: lang === "hi" ? "कोई पंजीकृत उपयोगकर्ता नहीं मिला" : "No registered users found",
    error: lang === "hi" ? "अभी उपयोगकर्ताओं को खोजा नहीं जा सका" : "Couldn't search users right now",
    loading: lang === "hi" ? "उपयोगकर्ता खोज रहे हैं…" : "Finding users…",
    registered: lang === "hi" ? "पंजीकृत उपयोगकर्ता" : "Registered users",
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const matches = await searchProfiles({ data: { query: query.trim() } });
        if (active) setProfiles(matches as SearchProfile[]);
      } catch {
        if (active) {
          setProfiles([]);
          setSearchError(labels.error);
        }
      } finally {
        if (active) setSearching(false);
      }
    }, query.trim() ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [authLoading, user, query, navigate, searchProfiles, labels.error]);

  const openChat = (profileId: string) => {
    navigate({ to: "/chat/$id", params: { id: profileId } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
      <header
        className="px-3 py-3 flex items-center gap-3 sticky top-0 z-20"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/home" })} className="p-1.5 -ml-1 rounded-full hover:bg-white/10" aria-label="back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <div className="font-semibold text-lg leading-tight">{labels.title}</div>
          <div className="text-xs opacity-80">{labels.registered}</div>
        </div>
      </header>

      <div className="px-3 py-2 bg-card sticky top-[60px] z-10 border-b border-border">
        <div className="bg-muted rounded-full flex items-center px-3 py-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search}
            autoComplete="off"
            className="bg-transparent outline-none px-2 py-1 text-sm flex-1"
          />
        </div>
      </div>

      <button
        onClick={() => searchRef.current?.focus()}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 border-b border-border/60"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"/><path d="M3 21v-1a6 6 0 0 1 6-6h2"/><path d="M19 16v6M16 19h6"/></svg>
        </div>
        <span className="font-semibold">{labels.addContact}</span>
      </button>

      <ul className="flex-1">
        {searching && (
          <li className="text-center text-sm text-muted-foreground py-12" aria-live="polite">{labels.loading}</li>
        )}
        {!searching && searchError && (
          <li role="alert" className="text-center text-sm text-destructive py-12">{searchError}</li>
        )}
        {!searching && !searchError && profiles.length === 0 && (
          <li className="text-center text-sm text-muted-foreground py-12">{labels.empty}</li>
        )}
        {!searching && profiles.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              onClick={() => openChat(profile.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 active:bg-muted/60 press"
            >
              <Avatar name={profile.username || "User"} hue={200} size={48} src={profile.avatar_url} />
              <div className="flex-1 min-w-0 border-b border-border/60 pb-3 -mb-3">
                <div className="font-semibold truncate">{profile.username || (lang === "hi" ? "उपयोगकर्ता" : "User")}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {profile.about || (lang === "hi" ? "चैट शुरू करने के लिए टैप करें" : "Tap to start chatting")}
                </div>
              </div>
              <svg className="text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
