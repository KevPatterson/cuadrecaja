'use client';
import React, { useState } from 'react';
import { Calendar, User, Clock, DollarSign } from 'lucide-react';
import type { MipymeConfig } from '@/lib/storage';

export interface TurnoData {
  fecha: string;
  cajero: string;
  turno: 'Mañana' | 'Tarde' | 'Noche' | 'Completo';
  fondo_apertura: number;
}

interface Props {
  data: TurnoData;
  onChange: (d: TurnoData) => void;
  config: MipymeConfig;
}

const TURNOS: Array<'Mañana' | 'Tarde' | 'Noche' | 'Completo'> = ['Mañana', 'Tarde', 'Noche', 'Completo'];

export default function Step1Turno({ data, onChange, config }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = config.cajeros.filter(c =>
    c.toLowerCase().includes(data.cajero.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
          Datos del Turno
        </h2>
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          Configura la información básica del turno de hoy.
        </p>
      </div>

      {/* Fecha */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Calendar size={12} />Fecha</span>
        </label>
        <input
          type="date"
          className="input-base"
          value={data.fecha}
          onChange={e => onChange({ ...data, fecha: e.target.value })}
        />
      </div>

      {/* Cajero */}
      <div className="relative">
        <label className="label">
          <span className="flex items-center gap-1.5"><User size={12} />Cajero <span className="text-red-400 normal-case font-normal tracking-normal">*</span></span>
        </label>
        <input
          type="text"
          className="input-base"
          placeholder="Nombre del cajero"
          value={data.cajero}
          onChange={e => { onChange({ ...data, cajero: e.target.value }); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
        />
        {showSuggestions && filtered.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg overflow-hidden shadow-xl"
            style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}
          >
            {filtered.map(c => (
              <button
                key={`cajero-sug-${c}`}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                style={{ color: 'hsl(var(--text-primary))' }}
                onMouseDown={() => { onChange({ ...data, cajero: c }); setShowSuggestions(false); }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Turno */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Clock size={12} />Turno</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TURNOS.map(t => {
            const isSelected = data.turno === t;
            return (
              <button
                key={`turno-btn-${t}`}
                type="button"
                onClick={() => onChange({ ...data, turno: t })}
                className={[
                  'py-3 px-3 rounded-lg text-sm font-semibold transition-all duration-150 border-2 cursor-pointer select-none',
                  isSelected
                    ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-transparent border-white/10 text-white/50 hover:border-white/25 hover:text-white/75 hover:bg-white/5',
                ].join(' ')}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fondo de apertura */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><DollarSign size={12} />Fondo de Apertura (CUP)</span>
        </label>
        <p className="text-xs mb-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
          Efectivo inicial en caja al comenzar el turno
        </p>
        <input
          type="number"
          className="input-base font-mono-nums"
          placeholder="0.00"
          min={0}
          step={0.01}
          value={data.fondo_apertura || ''}
          onChange={e => onChange({ ...data, fondo_apertura: parseFloat(e.target.value) || 0 })}
        />
        {config.fondo_base > 0 && data.fondo_apertura === 0 && (
          <button
            type="button"
            className="mt-1.5 text-xs underline underline-offset-2 transition-colors"
            style={{ color: 'hsl(var(--primary-light))' }}
            onClick={() => onChange({ ...data, fondo_apertura: config.fondo_base })}
          >
            Usar fondo base ({config.fondo_base.toFixed(2)} CUP)
          </button>
        )}
      </div>
    </div>
  );
}