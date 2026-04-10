'use client';
import React, { useEffect, useState } from 'react';
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

const TURNOS = ['Mañana', 'Tarde', 'Noche', 'Completo'] as const;

export default function Step1Turno({ data, onChange, config }: Props) {
  const [cajeroInput, setCajeroInput] = useState(data.cajero);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = config.cajeros.filter(c =>
    c.toLowerCase().includes(cajeroInput.toLowerCase())
  );

  useEffect(() => {
    onChange({ ...data, cajero: cajeroInput });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cajeroInput]);

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
          <span className="flex items-center gap-1.5"><User size={12} />Cajero</span>
        </label>
        <input
          type="text"
          className="input-base"
          placeholder="Nombre del cajero"
          value={cajeroInput}
          onChange={e => { setCajeroInput(e.target.value); setShowSuggestions(true); }}
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
                onMouseDown={() => { setCajeroInput(c); setShowSuggestions(false); }}
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
          {TURNOS.map(t => (
            <button
              key={`turno-${t}`}
              type="button"
              onClick={() => onChange({ ...data, turno: t })}
              className="py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 border"
              style={{
                background: data.turno === t ? 'hsl(var(--primary-dim))' : 'hsl(var(--surface-2))',
                borderColor: data.turno === t ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
                color: data.turno === t ? 'hsl(var(--primary-light))' : 'hsl(var(--text-secondary))',
              }}
            >
              {t}
            </button>
          ))}
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