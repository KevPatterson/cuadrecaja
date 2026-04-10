'use client';
import React, { useState } from 'react';
import { Save, Building2, Users, DollarSign, Plus, X } from 'lucide-react';
import type { MipymeConfig } from '@/lib/storage';
import { saveConfig } from '@/lib/storage';
import { toast } from 'sonner';

interface Props {
  config: MipymeConfig;
  onSaved: (cfg: MipymeConfig) => void;
}

export default function ConfigNegocio({ config, onSaved }: Props) {
  const [nombre, setNombre] = useState(config.nombre);
  const [fondoBase, setFondoBase] = useState(config.fondo_base.toString());
  const [cajeros, setCajeros] = useState<string[]>(config.cajeros || []);
  const [newCajero, setNewCajero] = useState('');
  const [saving, setSaving] = useState(false);

  const addCajero = () => {
    const trimmed = newCajero.trim();
    if (!trimmed || cajeros.includes(trimmed)) return;
    setCajeros([...cajeros, trimmed]);
    setNewCajero('');
  };

  const removeCajero = (name: string) => {
    setCajeros(cajeros.filter(c => c !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    const updated: MipymeConfig = {
      ...config,
      nombre: nombre.trim() || 'Mi Negocio',
      fondo_base: parseFloat(fondoBase) || 0,
      cajeros,
    };
    // Backend integration point: PATCH /api/config
    saveConfig(updated);
    onSaved(updated);
    toast.success('Configuración guardada correctamente.');
    setSaving(false);
  };

  return (
    <div
      className="card p-5 space-y-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={18} style={{ color: 'hsl(var(--primary-light))' }} />
        <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
          Datos del Negocio
        </h2>
      </div>

      {/* Nombre */}
      <div>
        <label className="label">Nombre del negocio</label>
        <input
          type="text"
          className="input-base"
          placeholder="Ej: Cafetería El Morro"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
        />
      </div>

      {/* Fondo base */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><DollarSign size={11} />Fondo base de apertura (CUP)</span>
        </label>
        <p className="text-xs mb-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
          Se pre-llena automáticamente en cada nuevo cuadre
        </p>
        <input
          type="number"
          className="input-base font-mono-nums"
          placeholder="0.00"
          min={0}
          step={0.01}
          value={fondoBase}
          onChange={e => setFondoBase(e.target.value)}
        />
      </div>

      {/* Cajeros */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Users size={11} />Cajeros</span>
        </label>
        <p className="text-xs mb-2" style={{ color: 'hsl(var(--text-muted))' }}>
          Aparecen como sugerencias al crear un cuadre
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {cajeros.map(c => (
            <span
              key={`cajero-tag-${c}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium"
              style={{
                background: 'hsl(var(--surface-3))',
                color: 'hsl(var(--text-secondary))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              {c}
              <button
                type="button"
                onClick={() => removeCajero(c)}
                className="transition-colors hover:text-red-400"
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {cajeros.length === 0 && (
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              No hay cajeros registrados
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="input-base flex-1"
            placeholder="Nombre del cajero"
            value={newCajero}
            onChange={e => setNewCajero(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCajero(); } }}
          />
          <button
            type="button"
            className="btn-ghost shrink-0"
            onClick={addCajero}
            disabled={!newCajero.trim()}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary w-full justify-center"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Guardando...
          </>
        ) : (
          <><Save size={15} />Guardar configuración</>
        )}
      </button>
    </div>
  );
}