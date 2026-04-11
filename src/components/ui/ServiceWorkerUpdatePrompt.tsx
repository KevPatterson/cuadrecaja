'use client';

import React, { useEffect, useRef, useState } from 'react';

type WaitingWorker = ServiceWorker | null;

export default function ServiceWorkerUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const waitingWorkerRef = useRef<WaitingWorker>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };

    const showIfWaiting = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        waitingWorkerRef.current = registration.waiting;
        setShowUpdate(true);
      }
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        showIfWaiting(registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorkerRef.current = registration.waiting || newWorker;
              setShowUpdate(true);
            }
          });
        });
      } catch {
        // No-op: app continues to work without SW registration.
      }
    };

    window.addEventListener('load', registerServiceWorker);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.removeEventListener('load', registerServiceWorker);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const applyUpdate = () => {
    const worker = waitingWorkerRef.current;
    if (!worker) return;
    worker.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdate(false);
  };

  const postponeUpdate = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 p-4"
      style={{ background: 'var(--bg)', border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)' }}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
        Nueva version disponible
      </p>
      <p className="mt-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
        Puedes actualizar ahora para usar la ultima mejora sin perder tus datos locales.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn-primary flex-1 justify-center text-sm"
          onClick={applyUpdate}
        >
          Actualizar
        </button>
        <button
          type="button"
          className="btn-ghost flex-1 justify-center text-sm"
          onClick={postponeUpdate}
        >
          Mas tarde
        </button>
      </div>
    </div>
  );
}
