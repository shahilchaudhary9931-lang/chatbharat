import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
  },
  loader: async ({ location }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return { needsSignIn: true as const, details: null };
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return { needsSignIn: false as const, details: data };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Could not load this authorization request: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const loaded = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
    if (error) {
      setBusy(false);
      setError(error.message);
    }
  }

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = loaded.details?.client?.name ?? "an app";

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-primary text-primary-foreground text-2xl font-bold">
        B
      </div>
      {loaded.needsSignIn ? (
        <>
          <h1 className="text-2xl font-bold">Sign in to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your Bhasha Chat account to approve this connection request.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            onClick={signIn}
            className="press mt-8 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
          >
            Continue with Google
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Connect {clientName} to your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This lets {clientName} read your conversations and send messages as you in Bhasha Chat.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <button
              disabled={busy}
              onClick={() => decide(true)}
              className="press rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => decide(false)}
              className="press rounded-xl border border-border px-4 py-3 font-medium disabled:opacity-60"
            >
              Deny
            </button>
          </div>
        </>
      )}
    </main>
  );
}
