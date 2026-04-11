'use client';
import React from 'react';
import { CheckCircle2, TrendingDown, TrendingUp, ShoppingBag, Wallet, CreditCard, Receipt, Scale, Save, FileText } from 'lucide-react';
import { formatCUP, getDiferenciaStatus } from '@/lib/storage';
import type { ProductoLine, Gasto } from '@/lib/storage';

interface Props {
  fondo_apertura: number;
  productos: ProductoLine[];
  transferencias: number;
  devoluciones: number;
  gastos: Gasto[];
  arqueo_total: number;
  observaciones: string;
  onObservaciones: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

export default function Step6Resumen({
  fondo_apertura,
  productos,
  transferencias,
  devoluciones,
  gastos,
  arqueo_total,
  observaciones,
  onObservaciones,
  onSave,
  saving,
}: Props) {
  const ventas_inventario = productos.reduce((s, p) => s + p.subtotal, 0);
  const gastos_total = gastos.reduce((s, g) => s + g.monto, 0);
  const ventas_total_dia = ventas_inventario + transferencias;
  const esperado_efectivo = fondo_apertura + ventas_inventario - gastos_total - devoluciones;
  const diferencia = arqueo_total - esperado_efectivo;
  const status = getDiferenciaStatus(diferencia);

  const statusConfig = {
    cuadra: {
      stamp: '✓ CUADRA',
      icon: CheckCircle2,
      className: 'result-stamp-cuadra',
      color: 'var(--green)',
    },
    faltante: {
      stamp: '✗ FALTANTE',
      icon: TrendingDown,
      className: 'result-stamp-faltante',
      color: 'var(--red)',
    },
    sobrante: {
      stamp: '⚠ SOBRANTE',
      icon: TrendingUp,
      className: 'result-stamp-sobrante',
      color: 'var(--amber)',
    },
  };

  const sc = statusConfig[status];
  const StatusIcon = sc.icon;

  const metrics = [
    {
      id: 'ventas-inv',
      label: 'Ventas por inventario',
      value: formatCUP(ventas_inventario),
      icon: ShoppingBag,
      color: 'hsl(var(--primary-light))',
      bg: 'hsl(var(--primary-dim))',
    },
    {
      id: 'ventas-total',
      label: 'Ventas totales del día',
      value: formatCUP(ventas_total_dia),
      icon: CreditCard,
      color: 'hsl(var(--primary-light))',
      bg: 'hsl(var(--primary-dim))',
    },
    {
      id: 'esperado',
      label: 'Esperado en efectivo',
      value: formatCUP(esperado_efectivo),
      icon: Wallet,
      color: 'hsl(var(--text-primary))',
      bg: 'hsl(var(--surface-3))',
    },
    {
      id: 'arqueo',
      label: 'Arqueo físico',
      value: formatCUP(arqueo_total),
      icon: Receipt,
      color: 'hsl(var(--text-primary))',
      bg: 'hsl(var(--surface-3))',
    },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          Resumen del Cierre
        </h2>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Verifica los totales y guarda el cuadre.
        </p>
      </div>

      {/* Difference banner */}
      <div className="text-center py-1">
        <StatusIcon size={22} style={{ color: sc.color, margin: '0 auto 0.5rem auto' }} />
        <span className={`result-stamp ${sc.className} text-sm sm:text-base px-4 sm:px-8 py-3 sm:py-4`}>{sc.stamp}</span>
        <p className="text-sm mt-2" style={{ color: sc.color }}>
          Diferencia: <span className="font-mono-nums font-medium">{diferencia >= 0 ? '+' : ''}{formatCUP(diferencia)}</span>
        </p>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map(m => {
          const MIcon = m.icon;
          return (
            <div
              key={`metric-${m.id}`}
              className="metric-strip p-2 space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <MIcon size={13} style={{ color: 'var(--ink-muted)', opacity: 0.7 }} />
                <p className="metric-label leading-tight">
                  {m.label}
                </p>
              </div>
              <p className="font-mono-nums metric-value">
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Calculation breakdown */}
      <div
        className="ledger-shell p-4 space-y-2.5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale size={15} style={{ color: 'var(--ink-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>
            Cálculo del esperado
          </p>
        </div>
        {[
          { label: 'Fondo de apertura', value: fondo_apertura, sign: '+', color: 'var(--ink)' },
          { label: 'Ventas (inventario)', value: ventas_inventario, sign: '+', color: 'var(--ink)' },
          { label: 'Devoluciones', value: devoluciones, sign: '−', color: 'var(--amber)' },
          { label: `Gastos (${gastos.length})`, value: gastos_total, sign: '−', color: 'var(--red)' },
        ].map(row => (
          <div key={`calc-${row.label}`} className="flex justify-between items-center text-sm">
            <span style={{ color: 'var(--ink-muted)' }}>{row.label}</span>
            <span className="font-mono-nums font-semibold" style={{ color: row.color }}>
              {row.sign} {formatCUP(row.value)}
            </span>
          </div>
        ))}
        <div
          className="pt-2 mt-1 border-t flex justify-between items-center text-sm font-bold"
          style={{ borderColor: 'var(--ink)' }}
        >
          <span style={{ color: 'var(--ink)' }}>Esperado en efectivo</span>
          <span className="font-mono-nums" style={{ color: 'var(--ink)' }}>
            = {formatCUP(esperado_efectivo)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: 'var(--ink-muted)' }}>Arqueo físico</span>
          <span className="font-mono-nums font-semibold" style={{ color: 'var(--ink)' }}>
            {formatCUP(arqueo_total)}
          </span>
        </div>
        <div
          className="pt-2 border-t flex justify-between items-center"
          style={{ borderColor: sc.color }}
        >
          <span className="text-sm font-bold" style={{ color: sc.color }}>Diferencia</span>
          <span className="font-mono-nums text-base font-bold" style={{ color: sc.color }}>
            {diferencia >= 0 ? '+' : ''}{formatCUP(diferencia)}
          </span>
        </div>
      </div>

      {/* Productos summary */}
      {productos.length > 0 && (
        <div
          className="ledger-shell p-4 space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-muted)' }}>
            Detalle de productos ({productos.length})
          </p>
          {productos.map((p, i) => (
            <div key={`resumen-prod-${i}`} className="flex justify-between items-center text-sm">
              <span className="truncate mr-2" style={{ color: 'var(--ink-muted)' }}>
                {p.nombre}
                <span className="text-xs ml-1" style={{ color: 'var(--ink-muted)' }}>
                  ×{p.vendidos}
                </span>
              </span>
              <span className="font-mono-nums shrink-0 font-medium" style={{ color: 'var(--ink)' }}>
                {formatCUP(p.subtotal)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Observaciones */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><FileText size={12} />Observaciones</span>
        </label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder="Notas adicionales sobre el turno (opcional)..."
          value={observaciones}
          onChange={e => onObservaciones(e.target.value)}
          style={{ lineHeight: '1.5' }}
        />
      </div>

      {/* Save button */}
      <button
        type="button"
        className="btn-primary w-full justify-center text-base py-3"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Guardando...
          </>
        ) : (
          <><Save size={18} />Guardar Cuadre</>
        )}
      </button>
    </div>
  );
}