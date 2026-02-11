// Custom service worker code for UniHub PWA
// This file is loaded by the VitePWA-generated service worker

// Background sync for email and calendar checks
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'check-emails') {
    event.waitUntil(checkForNewEmails());
  } else if (event.tag === 'check-calendar') {
    event.waitUntil(checkForCalendarReminders());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'check-emails-periodic') {
    event.waitUntil(checkForNewEmails());
  } else if (event.tag === 'check-calendar-periodic') {
    event.waitUntil(checkForCalendarReminders());
  }
});

// Check for new emails
async function checkForNewEmails() {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    if (clients.length === 0) {
      console.log('[SW] No clients available for email check');
      return;
    }

    // Send message to client to check emails (client has auth token)
    clients.forEach((client) => {
      client.postMessage({ type: 'CHECK_EMAILS' });
    });
  } catch (error) {
    console.error('[SW] Error checking emails:', error);
  }
}

// Check for calendar reminders
async function checkForCalendarReminders() {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    if (clients.length === 0) {
      console.log('[SW] No clients available for calendar check');
      return;
    }

    // Send message to client to check calendar (client has auth token)
    clients.forEach((client) => {
      client.postMessage({ type: 'CHECK_CALENDAR' });
    });
  } catch (error) {
    console.error('[SW] Error checking calendar:', error);
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        ...options,
        icon: options.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'unihub-notification',
        requireInteraction: false,
        silent: false,
      })
    );
  } else if (event.data.type === 'REGISTER_SYNC') {
    // Register background sync
    if ('sync' in self.registration) {
      self.registration.sync.register(event.data.tag).catch((err) => {
        console.error('[SW] Failed to register sync:', err);
      });
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If app is already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open the app
      if (self.clients.openWindow) {
        const url = event.notification.tag.includes('calendar')
          ? '/todo'
          : '/mail';
        return self.clients.openWindow(self.location.origin + url);
      }
    })
  );
});
