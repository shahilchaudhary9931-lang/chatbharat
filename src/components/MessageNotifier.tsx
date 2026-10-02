import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { getVapidPublicKey, savePushSubscription } from "@/lib/push.functions";
import { startPresence } from "@/lib/presence";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Registers the messaging service worker and stores the user's web-push
 * subscription so the backend can deliver notifications for new messages.
 */
export function MessageNotifier() {
  const { user } = useAuth();
  const fetchVapidKey = useServerFn(getVapidPublicKey);
  const saveSubscription = useServerFn(savePushSubscription);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    return startPresence(userId);
  }, [userId]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

    let cancelled = false;

    const enable = async () => {
      try {
        if (Notification.permission === "denied") return;
        if (Notification.permission === "default") {
          const result = await Notification.requestPermission();
          if (result !== "granted") return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        const { publicKey } = await fetchVapidKey({});
        if (!publicKey || cancelled) return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

        await saveSubscription({
          data: { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
      } catch (err) {
        console.error("Push setup failed", err);
      }
    };

    // Permission prompts need a user gesture on most browsers.
    if (Notification.permission === "granted") {
      void enable();
    } else {
      const onGesture = () => void enable();
      window.addEventListener("pointerdown", onGesture, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("pointerdown", onGesture);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [user, fetchVapidKey, saveSubscription]);

  return null;
}
