export interface MipymeConfig {
  nombre: string;
  cajeros: string[];
  fondo_base: number;
  gemini_key?: string;
}

export interface CatalogProduct {
  id: string;
  nombre: string;
  precio: number;
}

export interface ProductoLine {
  nombre: string;
  precio: number;
  stock_inicio: number;
  stock_fin: number;
  vendidos: number;
  subtotal: number;
}

export interface Gasto {
  id: string;
  concepto: string;
  monto: number;
}

export interface Cuadre {
  id: string;
  fecha: string;
  cajero: string;
  turno: 'Mañana' | 'Tarde' | 'Noche' | 'Completo';
  fondo_apertura: number;
  productos: ProductoLine[];
  transferencias: number;
  devoluciones: number;
  gastos: Gasto[];
  denom_counts: Record<number, number>;
  arqueo_total: number;
  ventas_inventario: number;
  ventas_total_dia: number;
  esperado_efectivo: number;
  diferencia: number;
  observaciones: string;
  ts: number;
}

const KEYS = {
  config: 'mipyme_config',
  catalog: 'mipyme_catalog',
  historial: 'mipyme_historial',
  draft: 'mipyme_draft',
} as const;

export function getConfig(): MipymeConfig {
  if (typeof window === 'undefined') return { nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 };
  try {
    const raw = localStorage.getItem(KEYS.config);
    if (!raw) return { nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 };
    return JSON.parse(raw);
  } catch {
    return { nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 };
  }
}

export function saveConfig(config: MipymeConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.config, JSON.stringify(config));
}

export function getCatalog(): CatalogProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.catalog);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCatalog(catalog: CatalogProduct[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.catalog, JSON.stringify(catalog));
}

export function getHistorial(): Cuadre[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.historial);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCuadre(cuadre: Cuadre): void {
  if (typeof window === 'undefined') return;
  const historial = getHistorial();
  const idx = historial.findIndex(c => c.id === cuadre.id);
  if (idx >= 0) {
    historial[idx] = cuadre;
  } else {
    historial.unshift(cuadre);
  }
  localStorage.setItem(KEYS.historial, JSON.stringify(historial));
}

export function deleteCuadre(id: string): void {
  if (typeof window === 'undefined') return;
  const historial = getHistorial().filter(c => c.id !== id);
  localStorage.setItem(KEYS.historial, JSON.stringify(historial));
}

export function saveDraft(draft: Partial<Cuadre> & { step?: number }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.draft, JSON.stringify(draft));
}

export function getDraft(): (Partial<Cuadre> & { step?: number }) | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.draft);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.draft);
}

export const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 3, 1] as const;

export function formatCUP(amount: number): string {
  return new Intl.NumberFormat('es-CU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' CUP';
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function getDiferenciaStatus(diferencia: number): 'cuadra' | 'faltante' | 'sobrante' {
  if (Math.abs(diferencia) < 0.01) return 'cuadra';
  if (diferencia < 0) return 'faltante';
  return 'sobrante';
}

// ─── CSV Export ────────────────────────────────────────────────────────────────

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportHistorialToCSV(historial: Cuadre[]): void {
  if (typeof window === 'undefined') return;

  const headers = [
    'ID', 'Fecha', 'Cajero', 'Turno', 'Fondo Apertura',
    'Ventas Inventario', 'Transferencias', 'Devoluciones',
    'Total Gastos', 'Arqueo Total', 'Ventas Total Día',
    'Esperado Efectivo', 'Diferencia', 'Estado',
    'Observaciones', 'Productos (JSON)', 'Gastos (JSON)',
    'Denominaciones (JSON)', 'Timestamp',
  ];

  const rows = historial.map(c => [
    c.id,
    c.fecha,
    c.cajero,
    c.turno,
    c.fondo_apertura,
    c.ventas_inventario,
    c.transferencias,
    c.devoluciones,
    c.gastos.reduce((s, g) => s + g.monto, 0),
    c.arqueo_total,
    c.ventas_total_dia,
    c.esperado_efectivo,
    c.diferencia,
    getDiferenciaStatus(c.diferencia),
    c.observaciones,
    JSON.stringify(c.productos),
    JSON.stringify(c.gastos),
    JSON.stringify(c.denom_counts),
    c.ts,
  ].map(escapeCsvField).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `cuadres_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── CSV Import / Recovery ─────────────────────────────────────────────────────

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function importHistorialFromCSV(csvText: string): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  if (typeof window === 'undefined') return result;

  const lines = csvText.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    result.errors.push('El archivo CSV está vacío o no tiene datos.');
    return result;
  }

  const existing = getHistorial();
  const existingIds = new Set(existing.map(c => c.id));
  const toImport: Cuadre[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 19) {
        result.errors.push(`Fila ${i + 1}: columnas insuficientes (${cols.length}/19).`);
        continue;
      }

      const id = cols[0].trim();
      if (!id) { result.skipped++; continue; }
      if (existingIds.has(id)) { result.skipped++; continue; }

      const cuadre: Cuadre = {
        id,
        fecha: cols[1],
        cajero: cols[2],
        turno: cols[3] as Cuadre['turno'],
        fondo_apertura: parseFloat(cols[4]) || 0,
        ventas_inventario: parseFloat(cols[5]) || 0,
        transferencias: parseFloat(cols[6]) || 0,
        devoluciones: parseFloat(cols[7]) || 0,
        gastos: JSON.parse(cols[16] || '[]'),
        arqueo_total: parseFloat(cols[9]) || 0,
        ventas_total_dia: parseFloat(cols[10]) || 0,
        esperado_efectivo: parseFloat(cols[11]) || 0,
        diferencia: parseFloat(cols[12]) || 0,
        observaciones: cols[14] || '',
        productos: JSON.parse(cols[15] || '[]'),
        denom_counts: JSON.parse(cols[17] || '{}'),
        ts: parseInt(cols[18]) || Date.now(),
      };

      toImport.push(cuadre);
      existingIds.add(id);
      result.imported++;
    } catch (e) {
      result.errors.push(`Fila ${i + 1}: error al parsear — ${e instanceof Error ? e.message : 'desconocido'}.`);
    }
  }

  if (toImport.length > 0) {
    const merged = [...toImport, ...existing].sort((a, b) => b.ts - a.ts);
    localStorage.setItem('mipyme_historial', JSON.stringify(merged));
  }

  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Automatic localStorage Backup ────────────────────────────────────────────

const BACKUP_KEY = 'mipyme_backup';
const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

export interface BackupSnapshot {
  ts: number;
  historial: Cuadre[];
  config: MipymeConfig;
  catalog: CatalogProduct[];
}

export function createBackupSnapshot(): void {
  if (typeof window === 'undefined') return;
  try {
    const snapshot: BackupSnapshot = {
      ts: Date.now(),
      historial: getHistorial(),
      config: getConfig(),
      catalog: getCatalog(),
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
  } catch {
    // Silently fail — backup is best-effort
  }
}

export function getBackupSnapshot(): BackupSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function restoreFromBackup(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const snapshot = getBackupSnapshot();
    if (!snapshot) return false;
    localStorage.setItem('mipyme_historial', JSON.stringify(snapshot.historial));
    localStorage.setItem('mipyme_config', JSON.stringify(snapshot.config));
    localStorage.setItem('mipyme_catalog', JSON.stringify(snapshot.catalog));
    return true;
  } catch {
    return false;
  }
}

export function startAutoBackup(): () => void {
  if (typeof window === 'undefined') return () => {};
  // Immediate backup on start
  createBackupSnapshot();
  const interval = setInterval(createBackupSnapshot, BACKUP_INTERVAL_MS);
  return () => clearInterval(interval);
}

export function exportBackupAsJSON(): void {
  if (typeof window === 'undefined') return;
  const snapshot = getBackupSnapshot();
  if (!snapshot) return;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date(snapshot.ts).toISOString().slice(0, 10);
  link.href = url;
  link.download = `backup_cuadrecaja_${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}