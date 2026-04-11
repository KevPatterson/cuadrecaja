'use client';
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import type { ProductoLine, CatalogProduct } from '@/lib/storage';
import { formatCUP } from '@/lib/storage';

interface Props {
  productos: ProductoLine[];
  onChange: (p: ProductoLine[]) => void;
  catalog: CatalogProduct[];
  showTesseractWarning?: boolean;
}

export default function Step3Inventario({ productos, onChange, catalog, showTesseractWarning = false }: Props) {
  const [newNombre, setNewNombre] = useState('');
  const [newPrecio, setNewPrecio] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('');
  const [showWarning, setShowWarning] = useState(showTesseractWarning);

  useEffect(() => {
    setShowWarning(showTesseractWarning);
  }, [showTesseractWarning]);

  const ventasInventario = productos.reduce((sum, p) => sum + p.subtotal, 0);

  const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

  const updateProduct = (idx: number, field: keyof ProductoLine, value: number | string) => {
    setShowWarning(false);
    const updated = productos.map((p, i) => {
      if (i !== idx) return p;
      const next = { ...p, [field]: value };
      if (field === 'stock_inicio' || field === 'stock_fin' || field === 'precio') {
        next.precio = roundMoney(Number(next.precio) || 0);
        next.vendidos = Math.max(0, (Number(next.stock_inicio) || 0) - (Number(next.stock_fin) || 0));
        next.subtotal = roundMoney(next.vendidos * (Number(next.precio) || 0));
      }
      return next;
    });
    onChange(updated);
  };

  const removeProduct = (idx: number) => {
    onChange(productos.filter((_, i) => i !== idx));
  };

  const addProduct = (nombre: string, precio: number) => {
    const newP: ProductoLine = {
      nombre,
      precio,
      stock_inicio: 0,
      stock_fin: 0,
      vendidos: 0,
      subtotal: 0,
    };
    onChange([...productos, newP]);
    setNewNombre('');
    setNewPrecio('');
    setShowAddForm(false);
  };

  const addFromCatalog = (prod: CatalogProduct) => {
    if (productos.some(p => p.nombre === prod.nombre)) return;
    addProduct(prod.nombre, prod.precio);
  };

  const filteredCatalog = catalog.filter(
    c =>
      c.nombre.toLowerCase().includes(catalogFilter.toLowerCase()) &&
      !productos.some(p => p.nombre === c.nombre)
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
            Inventario
          </h2>
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
            Ingresa el stock inicial y final de cada producto.
          </p>
        </div>
        <div
          className="text-right sm:text-right shrink-0 px-3 py-2 w-full sm:w-auto"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>Ventas</p>
          <p className="font-mono-nums text-base font-bold" style={{ color: 'var(--ink)' }}>
            {formatCUP(ventasInventario)}
          </p>
        </div>
      </div>

      {/* Catalog quick-add */}
      {catalog.length > 0 && (
        <div>
          <label className="label">Agregar del catálogo</label>
          <input
            type="text"
            className="input-base mb-2"
            placeholder="Buscar producto..."
            value={catalogFilter}
            onChange={e => setCatalogFilter(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {filteredCatalog.slice(0, 8).map(prod => (
              <button
                key={`cat-${prod.id}`}
                type="button"
                onClick={() => addFromCatalog(prod)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all duration-150 border"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--ink)',
                  color: 'var(--ink)',
                }}
              >
                <Plus size={11} />
                {prod.nombre}
                <span className="font-mono-nums" style={{ color: 'hsl(var(--text-muted))' }}>
                  {prod.precio.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products table */}
      {productos.length > 0 ? (
        <div className="space-y-3">
          <div
            id="tesseract-warning"
            style={{
              display: showWarning ? 'block' : 'none',
              border: '2px solid var(--amber)',
              padding: '10px 14px',
              marginBottom: '12px',
              fontSize: '13px',
              fontFamily: 'DM Mono',
              color: 'var(--amber)',
              background: 'var(--bg-alt)',
            }}
          >
            ⚠ Resultados de Tesseract - revisa cada fila antes de continuar. Los valores detectados pueden tener errores, especialmente en letra manuscrita.
          </div>

          {productos.map((prod, idx) => (
            <div
              key={`prod-line-${idx}`}
              className="p-3 space-y-3"
              style={{ background: 'var(--bg)', border: '2px solid var(--ink)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--text-primary))' }}>
                    {prod.nombre}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="text-right px-2 py-1"
                    style={{ background: 'var(--bg-alt)', border: '1px solid var(--ink)' }}
                  >
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Subtotal</p>
                    <p
                      className="font-mono-nums text-sm font-bold"
                      style={{ color: prod.subtotal > 0 ? 'var(--ink)' : 'var(--ink-muted)' }}
                    >
                      {prod.subtotal.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(idx)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: 'hsl(var(--text-muted))' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--text-muted))' }}>
                    Precio (CUP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="input-base text-center font-mono-nums text-sm"
                    value={prod.precio || ''}
                    onChange={e => updateProduct(idx, 'precio', roundMoney(parseFloat(e.target.value) || 0))}
                    onWheel={e => e.currentTarget.blur()}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--text-muted))' }}>
                    Stock inicio
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="input-base text-center font-mono-nums text-sm"
                    value={prod.stock_inicio || ''}
                    onChange={e => updateProduct(idx, 'stock_inicio', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--text-muted))' }}>
                    Stock fin
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="input-base text-center font-mono-nums text-sm"
                    value={prod.stock_fin || ''}
                    onChange={e => updateProduct(idx, 'stock_fin', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--text-muted))' }}>
                    Vendidos
                  </label>
                  <div
                    className="input-base text-center font-mono-nums text-sm flex items-center justify-center"
                    style={{
                      background: prod.vendidos > 0 ? 'hsl(var(--primary-dim))' : undefined,
                      color: prod.vendidos > 0 ? 'hsl(var(--primary-light))' : 'hsl(var(--text-muted))',
                      cursor: 'default',
                    }}
                  >
                    {prod.vendidos}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="p-8 text-center"
          style={{ background: 'var(--bg)', border: '2px dashed var(--ink)' }}
        >
          <Package size={32} className="mx-auto mb-2" style={{ color: 'hsl(var(--text-muted))' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--text-secondary))' }}>
            No hay productos agregados
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            Agrega productos del catálogo o crea uno nuevo
          </p>
        </div>
      )}

      {/* Add custom product */}
      {showAddForm ? (
        <div
          className="p-4 space-y-3 animate-fade-in"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            Nuevo producto (este turno)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="label">Nombre</label>
              <input
                type="text"
                className="input-base"
                placeholder="Ej: Refresco Cola"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Precio CUP</label>
              <input
                type="number"
                className="input-base font-mono-nums"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={newPrecio}
                onChange={e => setNewPrecio(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="btn-primary flex-1 justify-center"
              disabled={!newNombre.trim() || !newPrecio}
              onClick={() => addProduct(newNombre.trim(), parseFloat(newPrecio) || 0)}
            >
              <Plus size={15} />Agregar
            </button>
            <button type="button" className="btn-ghost w-full sm:w-auto justify-center" onClick={() => setShowAddForm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost w-full justify-center"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={15} />Agregar producto manual
        </button>
      )}
    </div>
  );
}