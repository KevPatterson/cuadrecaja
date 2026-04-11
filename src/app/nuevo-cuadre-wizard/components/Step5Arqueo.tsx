'use client';
import React from 'react';
import { Coins } from 'lucide-react';
import { DENOMINATIONS, formatCUP } from '@/lib/storage';

interface Props {
  denomCounts: Record<number, number>;
  onChange: (d: Record<number, number>) => void;
  ventasInventario: number;
  esperadoEfectivo: number;
}

export default function Step5Arqueo({ denomCounts, onChange, ventasInventario, esperadoEfectivo }: Props) {
  const total = DENOMINATIONS.reduce(
    (sum, d) => sum + d * (denomCounts[d] || 0),
    0
  );
  const diferencia = total - esperadoEfectivo;

  const update = (denom: number, qty: number) => {
    onChange({ ...denomCounts, [denom]: Math.max(0, qty) });
  };

  const nonZeroCount = DENOMINATIONS.filter(d => (denomCounts[d] || 0) > 0).length;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
            Arqueo Físico
          </h2>
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
            Cuenta el efectivo en caja por denominación.
          </p>
        </div>
        <div
          className="text-right shrink-0 px-3 py-2 w-full sm:w-auto"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>Total</p>
          <p className="font-mono-nums text-base font-bold" style={{ color: 'var(--ink)' }}>
            {formatCUP(total)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {DENOMINATIONS.map(denom => {
          const qty = denomCounts[denom] || 0;
          const subtotal = denom * qty;
          const isActive = qty > 0;
          return (
            <div
              key={`denom-${denom}`}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 sm:px-4 py-3 transition-all duration-150"
              style={{
                background: isActive ? 'var(--bg-alt)' : 'var(--bg)',
                border: `2px solid var(--ink)`,
              }}
            >
              {/* Denomination label */}
              <div className="flex items-center gap-2 w-full sm:w-20 shrink-0">
                <Coins size={14} style={{ color: isActive ? 'var(--ink)' : 'var(--ink-muted)' }} />
                <span
                  className="font-mono-nums text-sm font-bold"
                  style={{ color: isActive ? 'var(--ink)' : 'var(--ink-muted)' }}
                >
                  {denom >= 1000
                    ? `${(denom / 1000).toFixed(0)}k`
                    : `${denom}`}
                  <span className="text-xs font-normal ml-0.5">CUP</span>
                </span>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-2 w-full sm:flex-1">
                <button
                  type="button"
                  onClick={() => update(denom, qty - 1)}
                  disabled={qty === 0}
                  className="w-8 h-8 flex items-center justify-center text-lg font-bold transition-all duration-150 disabled:opacity-30"
                  style={{
                    background: 'var(--bg-alt)',
                    color: 'var(--ink)',
                    border: '1px solid var(--ink)',
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  className="input-base text-center font-mono-nums text-sm font-semibold flex-1 sm:flex-none"
                  style={{ maxWidth: '5rem' }}
                  value={qty || ''}
                  placeholder="0"
                  onChange={e => update(denom, parseInt(e.target.value) || 0)}
                />
                <button
                  type="button"
                  onClick={() => update(denom, qty + 1)}
                  className="w-8 h-8 flex items-center justify-center text-lg font-bold transition-all duration-150"
                  style={{
                    background: 'var(--ink)',
                    color: 'var(--bg)',
                    border: '1px solid var(--ink)',
                  }}
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right w-full sm:w-20 shrink-0">
                <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Subtotal</p>
                <p
                  className="font-mono-nums text-sm font-semibold"
                  style={{ color: isActive ? 'var(--ink)' : 'var(--ink-muted)' }}
                >
                  {subtotal.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
      >
        <div>
          <p className="text-xs font-medium" style={{ color: 'hsl(var(--text-muted))' }}>
            {nonZeroCount} denominaciones contadas
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
            {DENOMINATIONS.length - nonZeroCount} en cero
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium" style={{ color: 'hsl(var(--text-muted))' }}>
            Total arqueo
          </p>
          <p
            className="font-mono-nums text-xl font-bold"
            style={{ color: total > 0 ? 'var(--ink)' : 'var(--ink-muted)' }}
          >
            {formatCUP(total)}
          </p>
        </div>
      </div>

      <div
        className="p-4 space-y-2"
        style={{ background: 'var(--bg)', border: '2px solid var(--ink)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
          Referencia para comparar
        </p>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--ink-muted)' }}>Venta por inventario</span>
          <span className="font-mono-nums" style={{ color: 'var(--ink)' }}>{formatCUP(ventasInventario)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--ink-muted)' }}>Efectivo esperado en caja</span>
          <span className="font-mono-nums" style={{ color: 'var(--ink)' }}>{formatCUP(esperadoEfectivo)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1" style={{ borderTop: '1px solid var(--ink)' }}>
          <span style={{ color: 'var(--ink-muted)' }}>Diferencia vs arqueo</span>
          <span
            className="font-mono-nums font-semibold"
            style={{ color: diferencia === 0 ? 'var(--green)' : diferencia > 0 ? 'var(--amber)' : 'var(--red)' }}
          >
            {diferencia >= 0 ? '+' : ''}{formatCUP(diferencia)}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          Si hay diferencia, ajusta arriba las cantidades de billetes/monedas.
        </p>
      </div>
    </div>
  );
}