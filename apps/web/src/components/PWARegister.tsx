'use client';

import { useEffect } from 'react';

// Registers the PWA service worker. Safe to delete this file (and its
// usage in src/app/layout.tsx) to fully remove PWA behavior — the rest
// of the app does not depend on it.
export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-critical — app works fine without the service worker.
      });
    }
  }, []);

  return null;
}
