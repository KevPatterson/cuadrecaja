'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import StepIndicator from './components/StepIndicator';
import Step1Turno, { type TurnoData } from './components/Step1Turno';
import Step2OCR from './components/Step2OCR';
import Step3Inventario from './components/Step3Inventario';
import Step4IngresosGastos from './components/Step4IngresosGastos';
import Step5Arqueo from './components/Step5Arqueo';
import Step6Resumen from './components/Step6Resumen';
import {
  getConfig, getCatalog, saveCuadre, saveDraft, getDraft, clearDraft,
  saveConfig,
  generateId, getDiferenciaStatus, DENOMINATIONS,
  type MipymeConfig, type CatalogProduct, type ProductoLine, type Gasto, type Cuadre,
} from '@/lib/storage';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NuevoCuadrePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<MipymeConfig>({ nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 });
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Step 1 data
  const [turnoData, setTurnoData] = useState<TurnoData>({
    fecha: getTodayStr(),
    cajero: '',
    turno: 'Mañana',
    fondo_apertura: 0,
  });

  // Step 3
  const [productos, setProductos] = useState<ProductoLine[]>([]);
  const [showTesseractWarning, setShowTesseractWarning] = useState(false);

  // Step 4
  const [transferencias, setTransferencias] = useState(0);
  const [devoluciones, setDevoluciones] = useState(0);
  const [gastos, setGastos] = useState<Gasto[]>([]);

  // Step 5
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({});

  // Step 6
  const [observaciones, setObservaciones] = useState('');

  // Computed
  const arqueo_total = DENOMINATIONS.reduce((s, d) => s + d * (denomCounts[d] || 0), 0);
  const ventas_inventario = productos.reduce((s, p) => s + p.subtotal, 0);
  const gastos_total = gastos.reduce((s, g) => s + g.monto, 0);
  const esperado_efectivo = turnoData.fondo_apertura + ventas_inventario - gastos_total - devoluciones;

  // Load config, catalog, draft
  useEffect(() => {
    const cfg = getConfig();
    setConfig(cfg);
    if (cfg.fondo_base > 0) {
      setTurnoData(prev => ({ ...prev, fondo_apertura: cfg.fondo_base }));
    }
    if (cfg.gemini_key) setApiKey(cfg.gemini_key);
    setCatalog(getCatalog());

    const draft = getDraft();
    if (draft) {
      if (draft.step) setStep(draft.step);
      if (draft.fecha) setTurnoData({
        fecha: draft.fecha,
        cajero: draft.cajero || '',
        turno: draft.turno || 'Mañana',
        fondo_apertura: draft.fondo_apertura || cfg.fondo_base || 0,
      });
      if (draft.productos) setProductos(draft.productos);
      if (draft.transferencias !== undefined) setTransferencias(draft.transferencias);
      if (draft.devoluciones !== undefined) setDevoluciones(draft.devoluciones);
      if (draft.gastos) setGastos(draft.gastos);
      if (draft.denom_counts) setDenomCounts(draft.denom_counts);
      if (draft.observaciones) setObservaciones(draft.observaciones);
    }
  }, []);

  // Persist draft on changes
  const persistDraft = useCallback(() => {
    saveDraft({
      step,
      fecha: turnoData.fecha,
      cajero: turnoData.cajero,
      turno: turnoData.turno,
      fondo_apertura: turnoData.fondo_apertura,
      productos,
      transferencias,
      devoluciones,
      gastos,
      denom_counts: denomCounts,
      observaciones,
    });
    if (apiKey) {
      const cfg = getConfig();
      cfg.gemini_key = apiKey;
      saveConfig(cfg);
    }
  }, [step, turnoData, productos, transferencias, devoluciones, gastos, denomCounts, observaciones, apiKey]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  useEffect(() => {
    const persistNow = () => {
      persistDraft();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        persistNow();
      }
    };

    window.addEventListener('offline', persistNow);
    window.addEventListener('online', persistNow);
    window.addEventListener('beforeunload', persistNow);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('offline', persistNow);
      window.removeEventListener('online', persistNow);
      window.removeEventListener('beforeunload', persistNow);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [persistDraft]);

  const canProceed = (): boolean => {
    if (step === 1) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!turnoData.fecha) {
        toast.error('Selecciona la fecha del turno.');
        return;
      }
      if (!turnoData.cajero.trim()) {
        toast.error('Escribe el nombre del cajero para continuar.');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 6));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOCRProducts = (prods: ProductoLine[], fromTesseract = false) => {
    setProductos(prods);
    setShowTesseractWarning(fromTesseract && prods.length > 0);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ventas_total_dia = ventas_inventario + transferencias;
      const diferencia = arqueo_total - esperado_efectivo;

      const cuadre: Cuadre = {
        id: generateId('cuadre'),
        fecha: turnoData.fecha,
        cajero: turnoData.cajero,
        turno: turnoData.turno,
        fondo_apertura: turnoData.fondo_apertura,
        productos,
        transferencias,
        devoluciones,
        gastos,
        denom_counts: denomCounts,
        arqueo_total,
        ventas_inventario,
        ventas_total_dia,
        esperado_efectivo,
        diferencia,
        observaciones,
        ts: Date.now(),
      };

      // Backend integration point: POST cuadre to API
      saveCuadre(cuadre);
      clearDraft();

      const status = getDiferenciaStatus(diferencia);
      if (status === 'cuadra') {
        toast.success('Cuadre guardado. La caja cuadra.');
      } else if (status === 'faltante') {
        toast.error(`Cuadre guardado con faltante de ${Math.abs(diferencia).toFixed(2)} CUP.`);
      } else {
        toast.warning(`Cuadre guardado con sobrante de ${Math.abs(diferencia).toFixed(2)} CUP.`);
      }

      setTimeout(() => router.push('/historial-de-cuadres'), 1200);
    } catch {
      toast.error('No se pudo guardar el cuadre. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
            Nuevo cuadre
          </h1>
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
            Paso {step} de 6
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6">
          <StepIndicator currentStep={step} />
        </div>

        {/* Step content */}
        <div
          className="ledger-shell p-4 sm:p-5 mb-6"
          style={{ minHeight: '400px' }}
        >
          {step === 1 && (
            <Step1Turno
              data={turnoData}
              onChange={setTurnoData}
              config={config}
            />
          )}
          {step === 2 && (
            <Step2OCR
              apiKey={apiKey}
              savedApiKey={config.gemini_key}
              onApiKeyChange={setApiKey}
              onProductsExtracted={handleOCRProducts}
              onSkip={() => {
                setShowTesseractWarning(false);
                setStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
          {step === 3 && (
            <Step3Inventario
              productos={productos}
              onChange={setProductos}
              catalog={catalog}
              showTesseractWarning={showTesseractWarning}
            />
          )}
          {step === 4 && (
            <Step4IngresosGastos
              transferencias={transferencias}
              devoluciones={devoluciones}
              gastos={gastos}
              onTransferencias={setTransferencias}
              onDevoluciones={setDevoluciones}
              onGastos={setGastos}
            />
          )}
          {step === 5 && (
            <Step5Arqueo
              denomCounts={denomCounts}
              onChange={setDenomCounts}
              ventasInventario={ventas_inventario}
              esperadoEfectivo={esperado_efectivo}
            />
          )}
          {step === 6 && (
            <Step6Resumen
              fondo_apertura={turnoData.fondo_apertura}
              productos={productos}
              transferencias={transferencias}
              devoluciones={devoluciones}
              gastos={gastos}
              arqueo_total={arqueo_total}
              observaciones={observaciones}
              onObservaciones={setObservaciones}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>

        {/* Navigation */}
        {step < 6 && (
          <div className="flex gap-3">
            {step > 1 && (
              <button type="button" className="btn-ghost flex-1 justify-center" onClick={handleBack}>
                <ChevronLeft size={16} />Atrás
              </button>
            )}
            {step !== 2 && (
              <button
                type="button"
                className="btn-primary flex-1 justify-center"
                onClick={handleNext}
              >
                {step === 5 ? 'Ver resumen' : 'Continuar'}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}

        {step === 6 && (
          <button type="button" className="btn-ghost w-full justify-center" onClick={handleBack}>
            <ChevronLeft size={16} />Revisar arqueo
          </button>
        )}
      </div>
    </AppLayout>
  );
}