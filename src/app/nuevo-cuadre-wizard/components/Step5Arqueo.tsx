'use client';
import React from 'react';
import { Coins } from 'lucide-react';
import { DENOMINATIONS, formatCUP } from '@/lib/storage';

interface Props {
  denomCounts: Record<number, number>;
  onChange: (d: Record<number, number>) => void;
}

export default function Step5Arqueo({ denomCounts, onChange }: Props) {
  const total = DENOMINATIONS.reduce(
    (sum, d) => sum + d * (denomCounts[d] || 0),
    0
  );

  const update = (denom: number, qty: number) => {
    onChange({ ...denomCounts, [denom]: Math.max(0, qty) });
  };

  const nonZeroCount = DENOMINATIONS.filter(d => (denomCounts[d] || 0) > 0).length;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
            Arqueo Físico
          </h2>
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
            Cuenta el efectivo en caja por denominación.
          </p>
        </div>
        <div
          className="text-right shrink-0 rounded-lg px-3 py-2"
          style={{ background: 'hsl(var(--primary-dim))' }}
        >
          <p className="text-xs font-medium" style={{ color: 'hsl(var(--primary-light))' }}>Total</p>
          <p className="font-mono-nums text-base font-bold" style={{ color: 'hsl(var(--primary-light))' }}>
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-150"
              style={{
                background: isActive ? 'hsl(var(--primary-dim))' : 'hsl(var(--surface-2))',
                border: `1px solid ${isActive ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))'}`,
              }}
            >
              {/* Denomination label */}
              <div className="flex items-center gap-2 w-20 shrink-0">
                <Coins size={14} style={{ color: isActive ? 'hsl(var(--primary-light))' : 'hsl(var(--text-muted))' }} />
                <span
                  className="font-mono-nums text-sm font-bold"
                  style={{ color: isActive ? 'hsl(var(--primary-light))' : 'hsl(var(--text-secondary))' }}
                >
                  {denom >= 1000
                    ? `${(denom / 1000).toFixed(0)}k`
                    : `${denom}`}
                  <span className="text-xs font-normal ml-0.5">CUP</span>
                </span>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => update(denom, qty - 1)}
                  disabled={qty === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-150 disabled:opacity-30"
                  style={{
                    background: 'hsl(var(--surface-3))',
                    color: 'hsl(var(--text-secondary))',
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  className="input-base text-center font-mono-nums text-sm font-semibold flex-1"
                  style={{ maxWidth: '5rem' }}
                  value={qty || ''}
                  placeholder="0"
                  onChange={e => update(denom, parseInt(e.target.value) || 0)}
                />
                <button
                  type="button"
                  onClick={() => update(denom, qty + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-150"
                  style={{
                    background: 'hsl(var(--primary-dim))',
                    color: 'hsl(var(--primary-light))',
                  }}
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right w-20 shrink-0">
                <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Subtotal</p>
                <p
                  className="font-mono-nums text-sm font-semibold"
                  style={{ color: isActive ? 'hsl(var(--primary-light))' : 'hsl(var(--text-muted))' }}
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
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--border-subtle))' }}
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
            style={{ color: total > 0 ? 'hsl(var(--primary-light))' : 'hsl(var(--text-muted))' }}
          >
            {formatCUP(total)}
          </p>
        </div>
      </div>
    </div>
  );
}