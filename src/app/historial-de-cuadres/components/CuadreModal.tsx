'use client';
import React, { useState } from 'react';
import { X, User, Clock, ShoppingBag, Wallet, Scale, CreditCard, Receipt, Package, MinusCircle, AlertTriangle, Trash2, Printer } from 'lucide-react';
import type { Cuadre } from '@/lib/storage';
import { formatCUP, formatDate, getDiferenciaStatus, DENOMINATIONS, printCuadrePDF, getConfig } from '@/lib/storage';

interface Props {
  cuadre: Cuadre;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function CuadreModal({ cuadre, onClose, onDelete }: Props) {
  const status = getDiferenciaStatus(cuadre.diferencia);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const statusColors = {
    cuadra: { color: 'var(--green)', bg: 'var(--bg-alt)', label: 'Cuadra' },
    faltante: { color: 'var(--red)', bg: 'var(--bg-alt)', label: 'Faltante' },
    sobrante: { color: 'var(--amber)', bg: 'var(--bg-alt)', label: 'Sobrante' },
  };
  const sc = statusColors[status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg animate-slide-up overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg)',
          border: '2px solid var(--ink)',
          boxShadow: '4px 4px 0 var(--ink)',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'hsl(var(--border-subtle))' }}
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
                Cuadre — {formatDate(cuadre.fecha)}
              </h2>
              <span
                className="text-xs font-semibold px-2 py-0.5"
                style={{ background: sc.bg, color: sc.color }}
              >
                {sc.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                <User size={11} />{cuadre.cajero}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                <Clock size={11} />{cuadre.turno}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'hsl(var(--text-muted))' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto scrollbar-thin flex-1 px-5 py-4 space-y-5">
          {/* Difference highlight */}
          <div
            className="p-4 flex items-center justify-between"
            style={{ background: sc.bg, border: `2px solid ${sc.color}` }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: sc.color, opacity: 0.8 }}>Diferencia</p>
              <p className="font-mono-nums text-2xl font-bold" style={{ color: sc.color }}>
                {cuadre.diferencia >= 0 ? '+' : ''}{formatCUP(cuadre.diferencia)}
              </p>
            </div>
            <Scale size={28} style={{ color: sc.color, opacity: 0.5 }} />
          </div>

          {/* Métricas clave */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'ventas-inv', icon: ShoppingBag, label: 'Ventas inventario', value: formatCUP(cuadre.ventas_inventario) },
              { id: 'ventas-dia', icon: CreditCard, label: 'Ventas totales', value: formatCUP(cuadre.ventas_total_dia) },
              { id: 'esperado', icon: Wallet, label: 'Esperado', value: formatCUP(cuadre.esperado_efectivo) },
              { id: 'arqueo', icon: Receipt, label: 'Arqueo físico', value: formatCUP(cuadre.arqueo_total) },
            ].map(m => {
              const MIcon = m.icon;
              return (
                <div
                  key={`modal-metric-${m.id}`}
                  className="p-3"
                  style={{ background: 'var(--bg-alt)', border: '1px solid var(--ink)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MIcon size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{m.label}</p>
                  </div>
                  <p className="font-mono-nums text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
                    {m.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Productos */}
          {cuadre.productos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Productos ({cuadre.productos.length})
                </p>
              </div>
              <div
                className="overflow-hidden"
                style={{ border: '2px solid var(--ink)' }}
              >
                {cuadre.productos.map((p, i) => (
                  <div
                    key={`modal-prod-${i}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                    style={{
                      background: i % 2 === 0 ? 'hsl(var(--surface-2))' : 'hsl(var(--surface))',
                      borderBottom: i < cuadre.productos.length - 1 ? '1px solid hsl(var(--border-subtle))' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ color: 'hsl(var(--text-primary))' }}>{p.nombre}</p>
                      <p className="text-xs font-mono-nums" style={{ color: 'hsl(var(--text-muted))' }}>
                        {p.stock_inicio} → {p.stock_fin} · {p.precio.toFixed(2)} CUP/u
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-nums font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
                        {p.subtotal.toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                        ×{p.vendidos}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gastos */}
          {cuadre.gastos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MinusCircle size={14} style={{ color: 'hsl(var(--danger))' }} />
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Gastos ({cuadre.gastos.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {cuadre.gastos.map(g => (
                  <div key={`modal-gasto-${g.id}`} className="flex justify-between text-sm">
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>{g.concepto}</span>
                    <span className="font-mono-nums" style={{ color: 'hsl(var(--danger))' }}>
                      − {formatCUP(g.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Denominaciones */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={14} style={{ color: 'hsl(var(--text-muted))' }} />
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
                Arqueo por denominación
              </p>
            </div>
            <div className="space-y-1">
              {DENOMINATIONS.filter(d => (cuadre.denom_counts[d] || 0) > 0).map(d => (
                <div key={`modal-denom-${d}`} className="flex justify-between text-sm">
                  <span style={{ color: 'hsl(var(--text-secondary))' }}>
                    {d} CUP × {cuadre.denom_counts[d]}
                  </span>
                  <span className="font-mono-nums" style={{ color: 'hsl(var(--text-primary))' }}>
                    {(d * cuadre.denom_counts[d]).toFixed(2)}
                  </span>
                </div>
              ))}
              {DENOMINATIONS.every(d => !(cuadre.denom_counts[d] || 0)) && (
                <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                  No se registró arqueo por denominación.
                </p>
              )}
            </div>
          </div>

          {/* Observaciones */}
          {cuadre.observaciones && (
            <div
              className="p-4"
              style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--text-muted))' }}>
                Observaciones
              </p>
              <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
                {cuadre.observaciones}
              </p>
            </div>
          )}

          {/* Delete */}
          {!confirmDelete ? (
            <div className="space-y-2">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-150"
                style={{ color: 'var(--bg)', border: '2px solid var(--ink)', background: 'var(--ink)' }}
                onClick={() => {
                  const cfg = getConfig();
                  printCuadrePDF(cuadre, cfg.nombre || 'Mi Negocio');
                }}
              >
                <Printer size={15} />Exportar / Imprimir PDF
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-150 hover:bg-red-500/10"
                style={{ color: 'var(--red)', border: '2px solid var(--red)' }}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={15} />Eliminar este cuadre
              </button>
            </div>
          ) : (
            <div
              className="p-4 space-y-3"
              style={{ background: 'var(--bg-alt)', border: '2px solid var(--red)' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} style={{ color: 'hsl(var(--danger))' }} />
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--danger))' }}>
                  ¿Eliminar este cuadre? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-danger flex-1 justify-center text-sm"
                  onClick={() => onDelete(cuadre.id)}
                >
                  <Trash2 size={14} />Sí, eliminar
                </button>
                <button
                  type="button"
                  className="btn-ghost flex-1 justify-center text-sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}