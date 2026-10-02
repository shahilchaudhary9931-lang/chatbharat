import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/edit-profile")({
  head: () => ({
    meta: [
      { title: "Edit Profile | ChatWave" },
      { name: "description", content: "Change your display name and profile photo on ChatWave." },
      { property: "og:title", content: "Edit Profile | ChatWave" },
      { property: "og:description", content: "Change your display name and profile photo on ChatWave." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditProfile,
});

function EditProfile() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const L = {
    title: lang === "hi" ? "प्रोफ़ाइल संपादित करें" : "Edit Profile",
    name: lang === "hi" ? "आपका नाम" : "Your name",
    about: lang === "hi" ? "अबाउट" : "About",
    change: lang === "hi" ? "फ़ोटो बदलें" : "Change photo",
    remove: lang === "hi" ? "फ़ोटो हटाएँ" : "Remove photo",
    save: lang === "hi" ? "सेव करें" : "Save",
    saving: lang === "hi" ? "सेव हो रहा है…" : "Saving…",
    saved: lang === "hi" ? "प्रोफ़ाइल अपडेट हो गई" : "Profile updated",
    error: lang === "hi" ? "सेव नहीं हो सका" : "Couldn't save changes",
    nameHint: lang === "hi" ? "यह नाम आपकी चैट और संपर्कों में दिखेगा" : "This name appears in your chats and contacts",
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    setName(profile?.username || "");
    setPhoto(profile?.avatar_url || null);
    setAbout(profile?.about || "");
  }, [loading, user, profile, navigate]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhoto(typeof reader.result === "string" ? reader.result : null); setSaved(false); };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("profiles")
      .update({ username: name.trim() || null, avatar_url: photo, about: about.trim() || null })
      .eq("id", user.id);
    if (err) {
      setError(L.error);
    } else {
      if (photo) localStorage.setItem("cw_avatar", photo);
      else localStorage.removeItem("cw_avatar");
      await refreshProfile();
      setSaved(true);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header
        className="px-3 py-3 flex items-center gap-3 sticky top-0 z-20"
        style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
      >
        <button onClick={() => navigate({ to: "/profile" })} className="p-1.5 -ml-1 rounded-full hover:bg-white/10 press" aria-label="back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="font-semibold text-lg">{L.title}</h1>
      </header>

      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="relative">
          <Avatar name={name || "You"} hue={170} size={120} src={photo} />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg press"
            style={{ background: "var(--color-primary)" }}
            aria-label={L.change}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 19V8a2 2 0 0 0-2-2h-3.2l-1.4-2H7.6L6.2 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2Z" /><circle cx="12" cy="13" r="4" fill="var(--color-primary)" /></svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        </div>
        {photo && (
          <button onClick={() => { setPhoto(null); setSaved(false); }} className="mt-3 text-xs text-destructive hover:underline">
            {L.remove}
          </button>
        )}
      </div>

      <section className="px-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold" htmlFor="display-name">
          {L.name}
        </label>
        <input
          id="display-name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          className="w-full mt-1 bg-transparent border-b border-border focus:border-primary outline-none py-2 text-base"
          placeholder={L.name}
        />
        <p className="text-xs text-muted-foreground mt-2">{L.nameHint}</p>
        <label className="block mt-6 text-xs text-muted-foreground uppercase tracking-wide font-semibold" htmlFor="about">
          {L.about}
        </label>
        <input
          id="about"
          value={about}
          maxLength={140}
          onChange={(e) => { setAbout(e.target.value); setSaved(false); }}
          className="w-full mt-1 bg-transparent border-b border-border focus:border-primary outline-none py-2 text-base"
          placeholder="Hey there! I am using ChatWave."
        />
      </section>

      <div className="px-4 mt-8">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="w-full py-3 rounded-full text-white font-semibold text-sm shadow press disabled:opacity-60"
          style={{ background: "var(--color-primary)" }}
        >
          {saving ? L.saving : L.save}
        </button>
        {saved && <p className="text-center text-xs text-primary mt-3" aria-live="polite">{L.saved}</p>}
        {error && <p className="text-center text-xs text-destructive mt-3" role="alert">{error}</p>}
      </div>
    </div>
  );
}
