'use client';
import React from 'react';
import { Calendar, User, Clock, ChevronRight } from 'lucide-react';
import type { Cuadre } from '@/lib/storage';
import { formatDate, getDiferenciaStatus } from '@/lib/storage';

interface Props {
  cuadre: Cuadre;
  onClick: () => void;
}

export default function CuadreCard({ cuadre, onClick }: Props) {
  const status = getDiferenciaStatus(cuadre.diferencia);

  const badgeClass =
    status === 'cuadra' ? 'badge-cuadra' : status === 'faltante' ? 'badge-faltante' : 'badge-sobrante';

  const badgeLabel =
    status === 'cuadra' ?'Cuadra'
      : status === 'faltante'
      ? `Faltante ${Math.abs(cuadre.diferencia).toFixed(2)}`
      : `Sobrante ${Math.abs(cuadre.diferencia).toFixed(2)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="card w-full text-left p-4 transition-all duration-150"
      style={{
        borderColor:
          status === 'cuadra' ?'var(--green)'
            : status === 'faltante' ?'var(--red)' :'var(--amber)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
              {formatDate(cuadre.fecha)}
            </span>
            <span className={badgeClass}>{badgeLabel}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              <User size={11} />{cuadre.cajero}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              <Clock size={11} />{cuadre.turno}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              <Calendar size={11} />
              {new Date(cuadre.ts).toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0, marginTop: 2 }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div>
          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Ventas</p>
          <p className="font-mono-nums text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            {cuadre.ventas_total_dia.toFixed(0)} CUP
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Arqueo</p>
          <p className="font-mono-nums text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            {cuadre.arqueo_total.toFixed(0)} CUP
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Productos</p>
          <p className="font-mono-nums text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            {cuadre.productos.length}
          </p>
        </div>
      </div>
    </button>
  );
}