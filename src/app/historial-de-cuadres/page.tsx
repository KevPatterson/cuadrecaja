'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import CuadreCard from './components/CuadreCard';
import CuadreModal from './components/CuadreModal';
import {
  getHistorial, deleteCuadre, type Cuadre, getDiferenciaStatus,
  exportHistorialToCSV, importHistorialFromCSV,
} from '@/lib/storage';
import { toast } from 'sonner';
import { History, Search, SlidersHorizontal, X, Download, Upload } from 'lucide-react';

type FilterStatus = 'todos' | 'cuadra' | 'faltante' | 'sobrante';

export default function HistorialPage() {
  const [historial, setHistorial] = useState<Cuadre[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [selectedCuadre, setSelectedCuadre] = useState<Cuadre | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistorial(getHistorial());
    setLoaded(true);
  }, []);

  const handleDelete = (id: string) => {
    deleteCuadre(id);
    setHistorial(getHistorial());
    setSelectedCuadre(null);
    toast.success('Cuadre eliminado correctamente.');
  };

  const handleExportCSV = () => {
    if (historial.length === 0) {
      toast.error('No hay cuadres para exportar.');
      return;
    }
    exportHistorialToCSV(historial);
    toast.success(`${historial.length} cuadre${historial.length !== 1 ? 's' : ''} exportado${historial.length !== 1 ? 's' : ''} a CSV.`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const result = importHistorialFromCSV(text);
      setHistorial(getHistorial());
      if (result.imported > 0) {
        toast.success(
          `Importados ${result.imported} cuadre${result.imported !== 1 ? 's' : ''}.` +
          (result.skipped > 0 ? ` ${result.skipped} omitido${result.skipped !== 1 ? 's' : ''} (ya existían).` : '')
        );
      } else if (result.skipped > 0) {
        toast.info(`Todos los cuadres del archivo ya existen (${result.skipped} omitidos).`);
      } else {
        toast.error('No se pudo importar ningún cuadre.');
      }
      if (result.errors.length > 0) {
        result.errors.slice(0, 3).forEach(err => toast.error(err));
      }
    } catch {
      toast.error('Error al leer el archivo CSV.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = historial.filter(c => {
    const matchSearch =
      !search ||
      c.cajero.toLowerCase().includes(search.toLowerCase()) ||
      c.fecha.includes(search) ||
      c.turno.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === 'todos' || getDiferenciaStatus(c.diferencia) === filterStatus;

    return matchSearch && matchStatus;
  });

  const statusFilters: { key: FilterStatus; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'cuadra', label: 'Cuadra' },
    { key: 'faltante', label: 'Faltante' },
    { key: 'sobrante', label: 'Sobrante' },
  ];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
                Historial de Cuadres
              </h1>
              <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                {loaded ? `${historial.length} cuadre${historial.length !== 1 ? 's' : ''} guardado${historial.length !== 1 ? 's' : ''}` : 'Cargando...'}
              </p>
            </div>
            {/* Export / Import actions */}
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleImportClick}
                disabled={importing}
                title="Importar CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border"
                style={{
                  background: 'hsl(var(--surface-2))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                {importing ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Upload size={13} />
                )}
                Importar
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                title="Exportar CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border"
                style={{
                  background: 'hsl(var(--primary-dim))',
                  borderColor: 'hsl(var(--primary) / 0.3)',
                  color: 'hsl(var(--primary-light))',
                }}
              >
                <Download size={13} />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--text-muted))' }} />
          <input
            type="text"
            className="input-base pl-9 pr-9"
            placeholder="Buscar por cajero, fecha, turno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'hsl(var(--text-muted))' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-thin pb-1">
          {statusFilters.map(f => (
            <button
              key={`filter-${f.key}`}
              type="button"
              onClick={() => setFilterStatus(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 border shrink-0"
              style={{
                background:
                  filterStatus === f.key
                    ? f.key === 'cuadra' ? 'hsl(var(--primary-dim))'
                      : f.key === 'faltante' ? 'hsl(var(--danger-dim))'
                      : f.key === 'sobrante' ? 'hsl(var(--warning-dim))' : 'hsl(var(--surface-3))' : 'hsl(var(--surface-2))',
                borderColor:
                  filterStatus === f.key
                    ? f.key === 'cuadra' ? 'hsl(var(--primary) / 0.4)'
                      : f.key === 'faltante' ? 'hsl(var(--danger) / 0.4)'
                      : f.key === 'sobrante' ? 'hsl(var(--warning) / 0.4)' : 'hsl(var(--border))' : 'hsl(var(--border))',
                color:
                  filterStatus === f.key
                    ? f.key === 'cuadra' ? 'hsl(var(--primary-light))'
                      : f.key === 'faltante' ? 'hsl(var(--danger))'
                      : f.key === 'sobrante' ? 'hsl(var(--warning))' : 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
              }}
            >
              <SlidersHorizontal size={11} />
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {!loaded ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={`skel-${i}`} className="card p-4 animate-pulse">
                <div className="h-4 rounded w-2/3 mb-3" style={{ background: 'hsl(var(--surface-3))' }} />
                <div className="h-3 rounded w-1/2 mb-4" style={{ background: 'hsl(var(--surface-3))' }} />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-6 rounded" style={{ background: 'hsl(var(--surface-3))' }} />
                  <div className="h-6 rounded" style={{ background: 'hsl(var(--surface-3))' }} />
                  <div className="h-6 rounded" style={{ background: 'hsl(var(--surface-3))' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: 'hsl(var(--surface-2))', border: '1px dashed hsl(var(--border))' }}
          >
            <History size={36} className="mx-auto mb-3" style={{ color: 'hsl(var(--text-muted))' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--text-secondary))' }}>
              {historial.length === 0 ? 'No hay cuadres guardados' : 'Sin resultados'}
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              {historial.length === 0
                ? 'Completa tu primer cuadre de caja para verlo aquí.'
                : 'Intenta con otros filtros o términos de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <CuadreCard
                key={`card-${c.id}`}
                cuadre={c}
                onClick={() => setSelectedCuadre(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedCuadre && (
        <CuadreModal
          cuadre={selectedCuadre}
          onClose={() => setSelectedCuadre(null)}
          onDelete={handleDelete}
        />
      )}
    </AppLayout>
  );
}