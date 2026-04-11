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
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300"
      style={{
        background: isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        color: isOnline ? '#34d399' : '#f87171',
        border: `1px solid ${isOnline ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
      }}
    >
      {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
      <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Offline'}</span>
    </div>
  );

  // Toast banner for state changes
  const banner = showBanner ? (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 animate-fade-in"
      style={{
        background: justReconnected ? 'rgba(16,185,129,0.95)' : 'rgba(30,30,30,0.97)',
        color: justReconnected ? '#fff' : '#f87171',
        border: `1px solid ${justReconnected ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.3)'}`,
        backdropFilter: 'blur(8px)',
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
