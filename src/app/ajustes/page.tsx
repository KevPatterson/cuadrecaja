'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import ConfigNegocio from './components/ConfigNegocio';
import CatalogoCRUD from './components/CatalogoCRUD';
import {
  getConfig, getCatalog, saveConfig,
  type MipymeConfig, type CatalogProduct,
  getBackupSnapshot, exportBackupAsJSON, restoreFromBackup,
  startAutoBackup,
} from '@/lib/storage';
import { Settings, Trash2, AlertTriangle, Eye, EyeOff, Key, ShieldCheck, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function AjustesPage() {
  const [config, setConfig] = useState<MipymeConfig>({ nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 });
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [backupTs, setBackupTs] = useState<number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  useEffect(() => {
    const cfg = getConfig();
    setConfig(cfg);
    if (cfg.gemini_key) setApiKey(cfg.gemini_key);
    setCatalog(getCatalog());

    // Start auto-backup and refresh backup timestamp display
    const stopBackup = startAutoBackup();
    const snapshot = getBackupSnapshot();
    if (snapshot) setBackupTs(snapshot.ts);

    // Refresh backup timestamp every minute
    const refreshInterval = setInterval(() => {
      const s = getBackupSnapshot();
      if (s) setBackupTs(s.ts);
    }, 60_000);

    return () => {
      stopBackup();
      clearInterval(refreshInterval);
    };
  }, []);

  const handleConfigSaved = (cfg: MipymeConfig) => {
    setConfig(cfg);
  };

  const handleCatalogChange = (c: CatalogProduct[]) => {
    setCatalog(c);
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    await new Promise(r => setTimeout(r, 300));
    const updated = { ...config, gemini_key: apiKey.trim() };
    saveConfig(updated);
    setConfig(updated);
    toast.success('Clave API guardada correctamente.');
    setSavingKey(false);
  };

  const handleDownloadBackup = () => {
    const snapshot = getBackupSnapshot();
    if (!snapshot) {
      toast.error('No hay copia de seguridad disponible aún.');
      return;
    }
    exportBackupAsJSON();
    toast.success('Copia de seguridad descargada.');
  };

  const handleRestoreBackup = () => {
    const ok = restoreFromBackup();
    if (ok) {
      toast.success('Datos restaurados desde la copia de seguridad.');
      setShowRestoreConfirm(false);
      // Reload page state
      const cfg = getConfig();
      setConfig(cfg);
      if (cfg.gemini_key) setApiKey(cfg.gemini_key);
      setCatalog(getCatalog());
    } else {
      toast.error('No se encontró ninguna copia de seguridad para restaurar.');
      setShowRestoreConfirm(false);
    }
  };

  const handleClearAll = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mipyme_config');
    localStorage.removeItem('mipyme_catalog');
    localStorage.removeItem('mipyme_historial');
    localStorage.removeItem('mipyme_draft');
    setConfig({ nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 });
    setCatalog([]);
    setApiKey('');
    setShowClearConfirm(false);
    toast.success('Todos los datos han sido eliminados.');
  };

  const formatBackupTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('es-CU', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={22} style={{ color: 'var(--ink)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
              Ajustes
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
            Configura tu negocio, cajeros y catálogo de productos.
          </p>
        </div>

        {/* Config negocio */}
        <ConfigNegocio config={config} onSaved={handleConfigSaved} />

        {/* API Key Gemini */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Key size={18} style={{ color: 'var(--ink)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
              Clave API de Google Gemini (OCR)
            </h2>
          </div>
          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            Necesaria para el paso de OCR. Se guarda únicamente en este dispositivo. Obtén tu clave en{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors"
              style={{ color: 'var(--ink)' }}
            >
              aistudio.google.com
            </a>
          </p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="input-base pr-10"
              placeholder="AIza..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'hsl(var(--text-muted))' }}
              onClick={() => setShowKey(v => !v)}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            type="button"
            className="btn-primary w-full justify-center"
            onClick={handleSaveApiKey}
            disabled={savingKey || !apiKey.trim()}
          >
            {savingKey ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <><Key size={14} />Guardar clave API</>
            )}
          </button>
        </div>

        {/* Catalog */}
        <CatalogoCRUD catalog={catalog} onCatalogChange={handleCatalogChange} />

        {/* Backup & Recovery */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: 'var(--ink)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
              Copia de seguridad
            </h2>
          </div>

          {/* Auto-backup status */}
          <div
            className="flex items-center gap-3 px-3 py-2.5"
            style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
          >
            <span className="w-2 h-2 shrink-0" style={{ background: 'var(--ink)' }} />
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
                Respaldo automático activo
              </p>
              <p className="text-xs truncate" style={{ color: 'hsl(var(--text-muted))' }}>
                {backupTs
                  ? `Último respaldo: ${formatBackupTime(backupTs)}`
                  : 'Primer respaldo en curso...'}
              </p>
            </div>
          </div>

          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            Los datos se respaldan automáticamente cada 5 minutos en este dispositivo. Descarga el archivo JSON para guardar una copia externa.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-150 border"
              style={{
                background: 'var(--ink)',
                borderColor: 'var(--ink)',
                color: 'var(--bg)',
              }}
            >
              <Download size={14} />
              Descargar respaldo
            </button>
            <button
              type="button"
              onClick={() => setShowRestoreConfirm(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-150 border"
              style={{
                background: 'var(--bg)',
                borderColor: 'var(--ink)',
                color: 'var(--ink)',
              }}
            >
              <RotateCcw size={14} />
              Restaurar
            </button>
          </div>

          {showRestoreConfirm && (
            <div
              className="p-4 space-y-3 animate-fade-in"
              style={{ background: 'var(--bg-alt)', border: '2px solid var(--amber)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>
                ¿Restaurar desde el último respaldo automático? Los datos actuales serán reemplazados.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-all duration-150"
                  style={{ background: 'var(--amber)', color: 'var(--bg)', border: '2px solid var(--ink)' }}
                >
                  <RotateCcw size={13} />Sí, restaurar
                </button>
                <button
                  type="button"
                  className="btn-ghost flex-1 justify-center text-sm"
                  onClick={() => setShowRestoreConfirm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div
          className="card p-5 space-y-4"
          style={{ borderColor: 'var(--red)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--red)' }}>
              Zona de peligro
            </h2>
          </div>

          {!showClearConfirm ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
                Elimina todos los datos guardados en este dispositivo: historial de cuadres, catálogo, configuración y borradores.
              </p>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-150 hover:bg-red-500/10"
                style={{ color: 'var(--red)', border: '2px solid var(--red)' }}
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 size={15} />Borrar todos los datos
              </button>
            </div>
          ) : (
            <div
              className="p-4 space-y-3 animate-fade-in"
              style={{ background: 'var(--bg-alt)', border: '2px solid var(--red)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>
                ¿Estás seguro? Esta acción eliminará permanentemente todos los datos. No se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-danger flex-1 justify-center text-sm"
                  onClick={handleClearAll}
                >
                  <Trash2 size={14} />Sí, borrar todo
                </button>
                <button
                  type="button"
                  className="btn-ghost flex-1 justify-center text-sm"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* App info */}
        <div
          className="p-4 text-center"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'hsl(var(--text-muted))' }}>
            CuadreCaja
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
            Todos los datos se guardan localmente en este dispositivo. Sin conexión requerida.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}