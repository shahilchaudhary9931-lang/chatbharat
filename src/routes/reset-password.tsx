import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set Password | ChatWave" },
      { name: "description", content: "Set a new password for your ChatWave account." },
      { property: "og:title", content: "Set Password | ChatWave" },
      { property: "og:description", content: "Set a new password for your ChatWave account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { lang } = useI18n();
  const hi = lang === "hi";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(hi ? "पासवर्ड कम से कम 6 अक्षर का हो" : "Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-8">
      <h1 className="text-2xl font-bold">{hi ? "नया पासवर्ड सेट करें" : "Set a new password"}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-5 mt-8">
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-lg"
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold press disabled:opacity-60">
          {busy ? (hi ? "कृपया रुकें…" : "Please wait…") : hi ? "पासवर्ड सेव करें" : "Save password"}
        </button>
      </form>
    </div>
  );
}
