'use client';
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setShowBanner(true);
      setTimeout(() => {
        setJustReconnected(false);
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Small icon badge always visible in header
  const badge = (
    <div
      title={isOnline ? 'En línea' : 'Sin conexión — datos guardados localmente'}
      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium"
      style={{
        background: 'transparent',
        color: isOnline ? 'var(--bg)' : 'var(--red)',
        border: `2px solid ${isOnline ? 'var(--bg)' : 'var(--red)'}`,
      }}
    >
      {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
      <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Offline'}</span>
    </div>
  );

  // Toast banner for state changes
  const banner = showBanner ? (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 text-sm font-medium animate-fade-in"
      style={{
        background: 'var(--bg)',
        color: justReconnected ? 'var(--green)' : 'var(--red)',
        border: `2px solid ${justReconnected ? 'var(--green)' : 'var(--red)'}`,
        boxShadow: '4px 4px 0 var(--ink)',
      }}
    >
      {justReconnected ? (
        <>
          <Wifi size={15} />
          Conexión restaurada — datos sincronizados
        </>
      ) : (
        <>
          <WifiOff size={15} />
          Sin conexión — trabajando en modo offline
        </>
      )}
    </div>
  ) : null;

  return (
    <>
      {badge}
      {banner}
    </>
  );
}
