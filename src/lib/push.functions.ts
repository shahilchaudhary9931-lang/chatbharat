import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  p256dh: z.string().max(400),
  auth: z.string().max(400),
});

const notifySchema = z.object({
  receiverId: z.string().uuid(),
  text: z.string().max(2000),
});

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env["VAPID_PUBLIC_KEY"] ?? "" };
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => subscriptionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: context.userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth },
        { onConflict: "endpoint" },
      );
    if (error) {
      console.error("Saving push subscription failed", { code: error.code });
      throw new Error("Unable to enable notifications right now");
    }
    return { ok: true };
  });

export const notifyNewMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => notifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const publicKey = process.env["VAPID_PUBLIC_KEY"];
    const privateKey = process.env["VAPID_PRIVATE_KEY"];
    const subject = process.env["VAPID_SUBJECT"] ?? "mailto:notifications@example.com";
    if (!publicKey || !privateKey) return { sent: 0 };

    const { buildPushPayload } = await import("@block65/webcrypto-web-push");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: sender }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("profiles").select("username").eq("id", context.userId).maybeSingle(),
      supabaseAdmin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", data.receiverId),
    ]);

    if (!subs?.length) return { sent: 0 };

    const message = {
      data: {
        title: sender?.username || "New message",
        body: data.text.slice(0, 120),
        url: `/chat/${context.userId}`,
        tag: `chat-${context.userId}`,
      },
      options: { ttl: 3600, urgency: "high" as const },
    };

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          expirationTime: null,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          const payload = await buildPushPayload(message, subscription, {
            subject,
            publicKey,
            privateKey,
          });
          const res = await fetch(sub.endpoint, payload);
          if (res.ok) sent += 1;
          else if (res.status === 404 || res.status === 410) stale.push(sub.id);
        } catch (err) {
          console.error("Push delivery failed", err);
        }
      }),
    );

    if (stale.length) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", stale);
    }

    return { sent };
  });
