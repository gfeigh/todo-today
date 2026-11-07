// Minimal service worker. Its only job is to show task-start notifications
// (some mobile browsers only allow notifications through a service worker)
// and to bring the app back into focus when a notification is tapped.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w);
      if (open) return open.focus();
      return self.clients.openWindow('/');
    }),
  );
});
