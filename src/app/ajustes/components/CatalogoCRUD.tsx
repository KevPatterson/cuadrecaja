'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Package, Save } from 'lucide-react';
import type { CatalogProduct } from '@/lib/storage';
import { saveCatalog, generateId } from '@/lib/storage';
import { toast } from 'sonner';

interface Props {
  catalog: CatalogProduct[];
  onCatalogChange: (c: CatalogProduct[]) => void;
}

export default function CatalogoCRUD({ catalog, onCatalogChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newPrecio, setNewPrecio] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEdit = (prod: CatalogProduct) => {
    setEditingId(prod.id);
    setEditNombre(prod.nombre);
    setEditPrecio(prod.precio.toString());
  };

  const saveEdit = (id: string) => {
    if (!editNombre.trim()) return;
    const updated = catalog.map(p =>
      p.id === id
        ? { ...p, nombre: editNombre.trim(), precio: parseFloat(editPrecio) || 0 }
        : p
    );
    saveCatalog(updated);
    onCatalogChange(updated);
    setEditingId(null);
    toast.success('Producto actualizado en el catálogo.');
  };

  const cancelEdit = () => setEditingId(null);

  const addProduct = () => {
    if (!newNombre.trim()) return;
    const prod: CatalogProduct = {
      id: generateId('prod'),
      nombre: newNombre.trim(),
      precio: parseFloat(newPrecio) || 0,
    };
    const updated = [...catalog, prod];
    saveCatalog(updated);
    onCatalogChange(updated);
    setNewNombre('');
    setNewPrecio('');
    setShowAddForm(false);
    toast.success(`"${prod.nombre}" agregado al catálogo.`);
  };

  const deleteProduct = (id: string) => {
    const updated = catalog.filter(p => p.id !== id);
    saveCatalog(updated);
    onCatalogChange(updated);
    setConfirmDeleteId(null);
    toast.success('Producto eliminado del catálogo.');
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={18} style={{ color: 'var(--ink)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            Catálogo de productos
          </h2>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5"
          style={{ background: 'var(--bg-alt)', color: 'var(--ink-muted)', border: '1px solid var(--ink)' }}
        >
          {catalog.length} productos
        </span>
      </div>

      <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
        Los productos del catálogo aparecen como acceso rápido al crear un cuadre.
      </p>

      {/* Product list */}
      {catalog.length > 0 ? (
        <div className="space-y-2">
          {catalog.map(prod => (
            <div
              key={`catalog-prod-${prod.id}`}
              className="overflow-hidden transition-all duration-150"
              style={{ border: '2px solid var(--ink)' }}
            >
              {editingId === prod.id ? (
                <div
                  className="p-3 space-y-2 animate-fade-in"
                  style={{ background: 'var(--bg-alt)' }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--text-muted))' }}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        className="input-base text-sm"
                        value={editNombre}
                        onChange={e => setEditNombre(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--text-muted))' }}>
                        Precio CUP
                      </label>
                      <input
                        type="number"
                        className="input-base font-mono-nums text-sm"
                        min={0}
                        step={0.01}
                        value={editPrecio}
                        onChange={e => setEditPrecio(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary flex-1 justify-center text-sm py-2"
                      onClick={() => saveEdit(prod.id)}
                      disabled={!editNombre.trim()}
                    >
                      <Check size={14} />Guardar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-sm py-2"
                      onClick={cancelEdit}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : confirmDeleteId === prod.id ? (
                <div
                  className="p-3 space-y-2 animate-fade-in"
                  style={{ background: 'var(--bg-alt)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--red)' }}>
                    ¿Eliminar &quot;{prod.nombre}&quot;?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-danger flex-1 justify-center text-sm py-2"
                      onClick={() => deleteProduct(prod.id)}
                    >
                      <Trash2 size={14} />Eliminar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-sm py-2"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/3"
                  style={{ background: 'var(--bg)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
                      {prod.nombre}
                    </p>
                    <p className="font-mono-nums text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                      {prod.precio.toFixed(2)} CUP
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(prod)}
                      className="p-2 rounded-lg transition-colors hover:bg-white/10"
                      style={{ color: 'hsl(var(--text-muted))' }}
                      title="Editar producto"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(prod.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                      style={{ color: 'hsl(var(--text-muted))' }}
                      title="Eliminar producto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="p-8 text-center"
          style={{ background: 'var(--bg)', border: '2px dashed var(--ink)' }}
        >
          <Package size={28} className="mx-auto mb-2" style={{ color: 'hsl(var(--text-muted))' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--text-secondary))' }}>
            Catálogo vacío
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            Agrega los productos que vendes para agilizar el cuadre diario.
          </p>
        </div>
      )}

      {/* Add form */}
      {showAddForm ? (
        <div
          className="p-4 space-y-3 animate-fade-in"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
            Nuevo producto
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="label">Nombre del producto</label>
              <input
                type="text"
                className="input-base"
                placeholder="Ej: Refresco de cola 330ml"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addProduct(); }}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Precio (CUP)</label>
              <input
                type="number"
                className="input-base font-mono-nums"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={newPrecio}
                onChange={e => setNewPrecio(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addProduct(); }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1 justify-center"
              disabled={!newNombre.trim()}
              onClick={addProduct}
            >
              <Save size={14} />Agregar al catálogo
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setShowAddForm(false); setNewNombre(''); setNewPrecio(''); }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost w-full justify-center"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={15} />Agregar producto al catálogo
        </button>
      )}
    </div>
  );
}