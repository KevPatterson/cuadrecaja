'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { getConfig } from '@/lib/storage';
import { PlusCircle, History, Settings } from 'lucide-react';
import SyncIndicator from '@/components/ui/SyncIndicator';


const navItems = [
  { href: '/nuevo-cuadre-wizard', label: 'Nuevo Cuadre', icon: PlusCircle, short: 'Nuevo' },
  { href: '/historial-de-cuadres', label: 'Historial', icon: History, short: 'Historial' },
  { href: '/ajustes', label: 'Ajustes', icon: Settings, short: 'Ajustes' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [negocioNombre, setNegocioNombre] = useState('CuadreCaja');

  useEffect(() => {
    const cfg = getConfig();
    if (cfg.nombre) setNegocioNombre(cfg.nombre);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b-4" style={{ background: 'var(--ink)', borderColor: 'var(--red)' }}>
        <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo size={32} />
            <span className="app-title text-base" style={{ color: 'var(--bg)' }}>
              {negocioNombre}
            </span>
          </div>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={`nav-${item.href}`}
                  href={item.href}
                  className={`ledger-nav-link flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-150 ${active ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SyncIndicator />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-8">
        <div className="max-w-screen-lg mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex"
        style={{ background: 'var(--ink)', borderColor: 'var(--red)' }}
      >
        {navItems.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={`bottom-nav-${item.href}`}
              href={item.href}
              className={`ledger-nav-link flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all duration-150 ${active ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.short}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}