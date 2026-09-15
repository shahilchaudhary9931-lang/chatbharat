/* Messaging service worker: web push for new chat messages. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "New message", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "New message";
  const body = payload.body || "";
  const url = payload.url || "/home";
  const tag = payload.tag || "chat";

  event.waitUntil(
    (async () => {
      // Skip the notification when the matching chat is already open and visible.
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const chatOpen = windowClients.some(
        (client) =>
          client.visibilityState === "visible" &&
          new URL(client.url).pathname.startsWith(url),
      );
      if (chatOpen) return;

      await self.registration.showNotification(title, {
        body,
        tag,
        data: { url },
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/home";
  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windowClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
