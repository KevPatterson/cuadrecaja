'use client';
import React from 'react';
import { Plus, Trash2, ArrowDownLeft, ArrowUpRight, MinusCircle } from 'lucide-react';
import type { Gasto } from '@/lib/storage';
import { formatCUP, generateId } from '@/lib/storage';

interface Props {
  transferencias: number;
  devoluciones: number;
  gastos: Gasto[];
  onTransferencias: (v: number) => void;
  onDevoluciones: (v: number) => void;
  onGastos: (g: Gasto[]) => void;
}

export default function Step4IngresosGastos({
  transferencias,
  devoluciones,
  gastos,
  onTransferencias,
  onDevoluciones,
  onGastos,
}: Props) {
  const gastosTotal = gastos.reduce((s, g) => s + g.monto, 0);

  const addGasto = () => {
    onGastos([...gastos, { id: generateId('gasto'), concepto: '', monto: 0 }]);
  };

  const updateGasto = (id: string, field: keyof Gasto, value: string | number) => {
    onGastos(gastos.map(g => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const removeGasto = (id: string) => {
    onGastos(gastos.filter(g => g.id !== id));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
          Ingresos y Gastos
        </h2>
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          Registra transferencias recibidas, devoluciones y gastos del turno.
        </p>
      </div>

      {/* Transferencias */}
      <div
        className="p-4 space-y-3"
        style={{ background: 'var(--bg)', border: '2px solid var(--ink)' }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5" style={{ background: 'var(--bg-alt)', border: '1px solid var(--ink)' }}>
            <ArrowDownLeft size={16} style={{ color: 'var(--ink)' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            Transferencias recibidas
          </h3>
        </div>
        <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
          Pagos por transferencia bancaria o Transfermóvil recibidos en el turno
        </p>
        <input
          type="number"
          className="input-base font-mono-nums"
          placeholder="0.00"
          min={0}
          step={0.01}
          value={transferencias || ''}
          onChange={e => onTransferencias(parseFloat(e.target.value) || 0)}
        />
        {transferencias > 0 && (
          <p className="text-xs font-mono-nums" style={{ color: 'var(--ink)' }}>
            + {formatCUP(transferencias)}
          </p>
        )}
      </div>

      {/* Devoluciones */}
      <div
        className="p-4 space-y-3"
        style={{ background: 'var(--bg)', border: '2px solid var(--ink)' }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5" style={{ background: 'var(--bg-alt)', border: '1px solid var(--amber)' }}>
            <ArrowUpRight size={16} style={{ color: 'var(--amber)' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            Devoluciones
          </h3>
        </div>
        <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
          Efectivo devuelto a clientes por devolución de productos
        </p>
        <input
          type="number"
          className="input-base font-mono-nums"
          placeholder="0.00"
          min={0}
          step={0.01}
          value={devoluciones || ''}
          onChange={e => onDevoluciones(parseFloat(e.target.value) || 0)}
        />
        {devoluciones > 0 && (
          <p className="text-xs font-mono-nums" style={{ color: 'hsl(var(--warning))' }}>
            − {formatCUP(devoluciones)}
          </p>
        )}
      </div>

      {/* Gastos */}
      <div
        className="p-4 space-y-3"
        style={{ background: 'var(--bg)', border: '2px solid var(--ink)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5" style={{ background: 'var(--bg-alt)', border: '1px solid var(--red)' }}>
              <MinusCircle size={16} style={{ color: 'var(--red)' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
              Gastos del turno
            </h3>
          </div>
          {gastosTotal > 0 && (
            <span className="font-mono-nums text-sm font-bold" style={{ color: 'hsl(var(--danger))' }}>
              − {formatCUP(gastosTotal)}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {gastos.map(gasto => (
            <div key={`gasto-${gasto.id}`} className="flex gap-2 items-center">
              <input
                type="text"
                className="input-base flex-1 text-sm"
                placeholder="Concepto (ej: Transporte)"
                value={gasto.concepto}
                onChange={e => updateGasto(gasto.id, 'concepto', e.target.value)}
              />
              <input
                type="number"
                className="input-base font-mono-nums text-sm"
                style={{ width: '6.5rem', flexShrink: 0 }}
                placeholder="0.00"
                min={0}
                step={0.01}
                value={gasto.monto || ''}
                onChange={e => updateGasto(gasto.id, 'monto', parseFloat(e.target.value) || 0)}
              />
              <button
                type="button"
                onClick={() => removeGasto(gasto.id)}
                className="p-2 rounded-lg transition-colors hover:bg-red-500/10 shrink-0"
                style={{ color: 'hsl(var(--text-muted))' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="btn-ghost w-full justify-center text-sm" onClick={addGasto}>
          <Plus size={14} />Agregar gasto
        </button>
      </div>

      {/* Summary */}
      <div
        className="p-4 space-y-2"
        style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--text-muted))' }}>
          Resumen de este paso
        </p>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'hsl(var(--text-secondary))' }}>Transferencias</span>
          <span className="font-mono-nums" style={{ color: 'hsl(var(--primary-light))' }}>
            + {formatCUP(transferencias)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'hsl(var(--text-secondary))' }}>Devoluciones</span>
          <span className="font-mono-nums" style={{ color: 'hsl(var(--warning))' }}>
            − {formatCUP(devoluciones)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'hsl(var(--text-secondary))' }}>Total gastos ({gastos.length})</span>
          <span className="font-mono-nums" style={{ color: 'hsl(var(--danger))' }}>
            − {formatCUP(gastosTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}