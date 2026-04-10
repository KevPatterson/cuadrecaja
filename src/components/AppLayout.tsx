'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { getConfig } from '@/lib/storage';
import { PlusCircle, History, Settings } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


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
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border-subtle))' }}>
        <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo size={32} />
            <span className="font-semibold text-base tracking-tight" style={{ color: 'hsl(var(--text-primary))' }}>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'text-emerald-400' :'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: active ? 'hsl(var(--primary-dim))' : undefined,
                    color: active ? 'hsl(var(--primary-light))' : 'hsl(var(--text-secondary))',
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
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
        style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border-subtle))' }}
      >
        {navItems.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={`bottom-nav-${item.href}`}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all duration-150"
              style={{ color: active ? 'hsl(var(--primary-light))' : 'hsl(var(--text-muted))' }}
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