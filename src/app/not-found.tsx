'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

export default function NotFound() {
    const router = useRouter();

    const handleGoHome = () => {
        router?.push('/');
    };

    const handleGoBack = () => {
        if (typeof window !== 'undefined') {
            window.history?.back();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
            <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <h1 className="text-9xl font-bold" style={{ color: 'var(--ink)', opacity: 0.22 }}>404</h1>
                    </div>
                </div>

                <h2 className="text-2xl font-medium mb-2" style={{ color: 'var(--ink)' }}>Página no encontrada</h2>
                <p className="mb-8" style={{ color: 'var(--ink-muted)' }}>
                    La página que buscas no existe. Volvamos al libro mayor.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleGoBack}
                        className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 font-medium"
                    >
                        <Icon name="ArrowLeftIcon" size={16} />
                        Volver
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="btn-ghost inline-flex items-center justify-center gap-2 px-6 py-3 font-medium"
                    >
                        <Icon name="HomeIcon" size={16} />
                        Ir al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}