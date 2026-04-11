import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import ServiceWorkerUpdatePrompt from '@/components/ui/ServiceWorkerUpdatePrompt';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'CuadreCaja — Cuadre de Caja para MIPYME Cubana',
  description: 'Aplicación de cuadre de caja diario para pequeñas empresas cubanas. Inventario, arqueo físico y cierre de turno sin conexión.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    apple: '/assets/images/icon-192.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d0d0d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cuadre" />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#f5f0e8',
              border: '2px solid #0d0d0d',
              color: '#0d0d0d',
              boxShadow: '4px 4px 0 #0d0d0d',
              fontFamily: 'DM Mono, monospace',
              fontSize: '14px',
            },
          }}
        />
        <ServiceWorkerUpdatePrompt />
      </body>
    </html>
  );
}