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
      label: '✓ La caja cuadra',
      icon: CheckCircle2,
      bg: 'hsl(var(--primary-dim))',
      border: 'hsl(var(--primary) / 0.4)',
      color: 'hsl(var(--primary-light))',
    },
    faltante: {
      label: `Faltante de ${formatCUP(Math.abs(diferencia))}`,
      icon: TrendingDown,
      bg: 'hsl(var(--danger-dim))',
      border: 'hsl(var(--danger) / 0.4)',
      color: 'hsl(var(--danger))',
    },
    sobrante: {
      label: `Sobrante de ${formatCUP(Math.abs(diferencia))}`,
      icon: TrendingUp,
      bg: 'hsl(var(--warning-dim))',
      border: 'hsl(var(--warning) / 0.4)',
      color: 'hsl(var(--warning))',
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
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
          Resumen del Cierre
        </h2>
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          Verifica los totales y guarda el cuadre.
        </p>
      </div>

      {/* Difference banner */}
      <div
        className="rounded-xl p-5 flex items-center gap-4"
        style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
      >
        <StatusIcon size={32} style={{ color: sc.color, flexShrink: 0 }} />
        <div>
          <p className="text-base font-bold" style={{ color: sc.color }}>
            {sc.label}
          </p>
          <p className="text-sm mt-0.5" style={{ color: sc.color, opacity: 0.8 }}>
            Diferencia:{' '}
            <span className="font-mono-nums font-bold">
              {diferencia >= 0 ? '+' : ''}{formatCUP(diferencia)}
            </span>
          </p>
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => {
          const MIcon = m.icon;
          return (
            <div
              key={`metric-${m.id}`}
              className="rounded-xl p-3 space-y-2"
              style={{ background: m.bg, border: '1px solid hsl(var(--border-subtle))' }}
            >
              <div className="flex items-center gap-1.5">
                <MIcon size={13} style={{ color: m.color, opacity: 0.7 }} />
                <p className="text-xs font-medium leading-tight" style={{ color: m.color, opacity: 0.7 }}>
                  {m.label}
                </p>
              </div>
              <p className="font-mono-nums text-base font-bold" style={{ color: m.color }}>
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Calculation breakdown */}
      <div
        className="rounded-xl p-4 space-y-2.5"
        style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale size={15} style={{ color: 'hsl(var(--text-muted))' }} />
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
            Cálculo del esperado
          </p>
        </div>
        {[
          { label: 'Fondo de apertura', value: fondo_apertura, sign: '+', color: 'hsl(var(--text-primary))' },
          { label: 'Ventas (inventario)', value: ventas_inventario, sign: '+', color: 'hsl(var(--primary-light))' },
          { label: 'Devoluciones', value: devoluciones, sign: '−', color: 'hsl(var(--warning))' },
          { label: `Gastos (${gastos.length})`, value: gastos_total, sign: '−', color: 'hsl(var(--danger))' },
        ].map(row => (
          <div key={`calc-${row.label}`} className="flex justify-between items-center text-sm">
            <span style={{ color: 'hsl(var(--text-secondary))' }}>{row.label}</span>
            <span className="font-mono-nums font-semibold" style={{ color: row.color }}>
              {row.sign} {formatCUP(row.value)}
            </span>
          </div>
        ))}
        <div
          className="pt-2 mt-1 border-t flex justify-between items-center text-sm font-bold"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <span style={{ color: 'hsl(var(--text-primary))' }}>Esperado en efectivo</span>
          <span className="font-mono-nums" style={{ color: 'hsl(var(--text-primary))' }}>
            = {formatCUP(esperado_efectivo)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: 'hsl(var(--text-secondary))' }}>Arqueo físico</span>
          <span className="font-mono-nums font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            {formatCUP(arqueo_total)}
          </span>
        </div>
        <div
          className="pt-2 border-t flex justify-between items-center"
          style={{ borderColor: sc.border }}
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
          className="rounded-xl p-4 space-y-2"
          style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
            Detalle de productos ({productos.length})
          </p>
          {productos.map((p, i) => (
            <div key={`resumen-prod-${i}`} className="flex justify-between items-center text-sm">
              <span className="truncate mr-2" style={{ color: 'hsl(var(--text-secondary))' }}>
                {p.nombre}
                <span className="text-xs ml-1" style={{ color: 'hsl(var(--text-muted))' }}>
                  ×{p.vendidos}
                </span>
              </span>
              <span className="font-mono-nums shrink-0 font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
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