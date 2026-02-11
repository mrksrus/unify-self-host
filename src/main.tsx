import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { initServiceWorker, registerPeriodicSync } from "./utils/service-worker";

// Register service worker
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    console.log('[SW] Service Worker registered:', swUrl);
    // Initialize our service worker utilities
    if (registration) {
      initServiceWorker();
      // Register periodic background sync for email checks (if supported)
      registerPeriodicSync('check-emails-periodic', 10).catch(console.error);
    }
  },
  onNeedRefresh() {
    console.log('[SW] Update available');
  },
  onOfflineReady() {
    console.log('[SW] App ready to work offline');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
