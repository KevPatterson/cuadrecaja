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

function normalizeConfig(raw: unknown): MipymeConfig {
  const base: MipymeConfig = { nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 };
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Record<string, unknown>;
  const nombre = typeof record.nombre === 'string' && record.nombre.trim()
    ? record.nombre
    : base.nombre;
  const fondo_base = typeof record.fondo_base === 'number' && Number.isFinite(record.fondo_base)
    ? record.fondo_base
    : base.fondo_base;
  const cajeros = Array.isArray(record.cajeros)
    ? record.cajeros.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    : base.cajeros;

  const geminiFromGemini = typeof record.gemini_key === 'string' ? record.gemini_key.trim() : '';
  const geminiFromAnthropicLegacy = typeof record.anthropic_key === 'string' ? record.anthropic_key.trim() : '';
  const gemini_key = geminiFromGemini || geminiFromAnthropicLegacy || undefined;

  return { nombre, fondo_base, cajeros, gemini_key };
}

export function getConfig(): MipymeConfig {
  if (typeof window === 'undefined') return { nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 };
  try {
    const raw = localStorage.getItem(KEYS.config);
    if (!raw) return { nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 };
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return { nombre: 'Mi Negocio', cajeros: [], fondo_base: 0 };
  }
}

export function saveConfig(config: MipymeConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.config, JSON.stringify(normalizeConfig(config)));
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

// ─── PDF / Print Export ────────────────────────────────────────────────────────

export function printCuadrePDF(cuadre: Cuadre, negocioNombre: string): void {
  if (typeof window === 'undefined') return;

  const status = getDiferenciaStatus(cuadre.diferencia);
  const statusLabel = status === 'cuadra' ? 'CUADRA' : status === 'faltante' ? 'FALTANTE' : 'SOBRANTE';
  const statusColor = status === 'cuadra' ? '#16a34a' : status === 'faltante' ? '#dc2626' : '#d97706';

  const gastos_total = cuadre.gastos.reduce((s, g) => s + g.monto, 0);

  const productosRows = cuadre.productos.length > 0
    ? cuadre.productos.map((p, i) => `
        <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${p.nombre}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${p.precio.toFixed(2)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${p.stock_inicio}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${p.stock_fin}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${p.vendidos}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${p.subtotal.toFixed(2)}</td>
        </tr>`).join('')
    : `<tr><td colspan="6" style="padding:10px;text-align:center;color:#6b7280">Sin productos registrados</td></tr>`;

  const gastosRows = cuadre.gastos.length > 0
    ? cuadre.gastos.map(g => `
        <tr>
          <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb">${g.concepto}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626">− ${g.monto.toFixed(2)}</td>
        </tr>`).join('')
    : '';

  const activeDenoms = DENOMINATIONS.filter(d => (cuadre.denom_counts[d] || 0) > 0);
  const denomRows = activeDenoms.length > 0
    ? activeDenoms.map(d => `
        <tr>
          <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb">${d} CUP</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;text-align:center">× ${cuadre.denom_counts[d]}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${(d * cuadre.denom_counts[d]).toFixed(2)}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:10px;text-align:center;color:#6b7280">Sin denominaciones registradas</td></tr>`;

  const printedAt = new Date().toLocaleString('es-CU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Cuadre de Caja — ${formatDate(cuadre.fecha)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111827; background: #fff; padding: 24px; }
    .page { max-width: 720px; margin: 0 auto; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
    .header-left h1 { font-size: 20px; font-weight: 700; }
    .header-left p { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .header-right { text-align: right; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 13px; color: ${statusColor}; border: 2px solid ${statusColor}; }
    .header-right .diff { font-size: 22px; font-weight: 700; color: ${statusColor}; margin-top: 4px; }
    /* Meta */
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .meta-item { background: #f3f4f6; border-radius: 6px; padding: 8px 10px; }
    .meta-item .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-item .val { font-size: 13px; font-weight: 600; margin-top: 2px; }
    /* Summary */
    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; }
    .summary-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; }
    .summary-card .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; }
    .summary-card .val { font-size: 15px; font-weight: 700; margin-top: 2px; }
    /* Section */
    .section { margin-bottom: 16px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #111827; color: #fff; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    th:not(:first-child) { text-align: right; }
    th.center { text-align: center; }
    /* Formula */
    .formula { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
    .formula-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
    .formula-row.total { border-top: 1px solid #d1d5db; margin-top: 4px; padding-top: 6px; font-weight: 700; font-size: 13px; }
    .formula-row .result { color: ${statusColor}; font-weight: 700; }
    /* Obs */
    .obs { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px; }
    /* Footer */
    .footer { border-top: 1px solid #d1d5db; padding-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>${negocioNombre}</h1>
      <p>Cuadre de Caja — Registro Oficial</p>
    </div>
    <div class="header-right">
      <div class="status-badge">${statusLabel}</div>
      <div class="diff">${cuadre.diferencia >= 0 ? '+' : ''}${cuadre.diferencia.toFixed(2)} CUP</div>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item"><div class="lbl">Fecha</div><div class="val">${formatDate(cuadre.fecha)}</div></div>
    <div class="meta-item"><div class="lbl">Cajero</div><div class="val">${cuadre.cajero}</div></div>
    <div class="meta-item"><div class="lbl">Turno</div><div class="val">${cuadre.turno}</div></div>
  </div>

  <!-- Summary cards -->
  <div class="summary">
    <div class="summary-card"><div class="lbl">Ventas del día</div><div class="val">${cuadre.ventas_total_dia.toFixed(2)} CUP</div></div>
    <div class="summary-card"><div class="lbl">Ventas inventario</div><div class="val">${cuadre.ventas_inventario.toFixed(2)} CUP</div></div>
    <div class="summary-card"><div class="lbl">Esperado en caja</div><div class="val">${cuadre.esperado_efectivo.toFixed(2)} CUP</div></div>
    <div class="summary-card"><div class="lbl">Arqueo físico</div><div class="val">${cuadre.arqueo_total.toFixed(2)} CUP</div></div>
  </div>

  <!-- Products -->
  <div class="section">
    <div class="section-title">Inventario de Productos</div>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align:right">Precio CUP</th>
          <th class="center">Inicio</th>
          <th class="center">Fin</th>
          <th class="center">Vendidos</th>
          <th style="text-align:right">Subtotal CUP</th>
        </tr>
      </thead>
      <tbody>${productosRows}</tbody>
      <tfoot>
        <tr style="background:#f3f4f6">
          <td colspan="5" style="padding:6px 10px;font-weight:700;text-align:right">Total ventas inventario:</td>
          <td style="padding:6px 10px;font-weight:700;text-align:right">${cuadre.ventas_inventario.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${cuadre.gastos.length > 0 ? `
  <!-- Gastos -->
  <div class="section">
    <div class="section-title">Gastos del Turno</div>
    <table>
      <thead><tr><th>Concepto</th><th style="text-align:right">Monto CUP</th></tr></thead>
      <tbody>${gastosRows}</tbody>
      <tfoot>
        <tr style="background:#f3f4f6">
          <td style="padding:6px 10px;font-weight:700;text-align:right">Total gastos:</td>
          <td style="padding:6px 10px;font-weight:700;text-align:right;color:#dc2626">− ${gastos_total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  </div>` : ''}

  <!-- Denominaciones -->
  <div class="section">
    <div class="section-title">Arqueo por Denominación</div>
    <table>
      <thead><tr><th>Denominación</th><th class="center">Cantidad</th><th style="text-align:right">Subtotal CUP</th></tr></thead>
      <tbody>${denomRows}</tbody>
      <tfoot>
        <tr style="background:#f3f4f6">
          <td colspan="2" style="padding:6px 10px;font-weight:700;text-align:right">Total arqueo:</td>
          <td style="padding:6px 10px;font-weight:700;text-align:right">${cuadre.arqueo_total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Formula -->
  <div class="section">
    <div class="section-title">Conciliación</div>
    <div class="formula">
      <div class="formula-row"><span>Fondo de apertura</span><span>+ ${cuadre.fondo_apertura.toFixed(2)} CUP</span></div>
      <div class="formula-row"><span>Ventas en inventario</span><span>+ ${cuadre.ventas_inventario.toFixed(2)} CUP</span></div>
      ${cuadre.devoluciones > 0 ? `<div class="formula-row"><span>Devoluciones</span><span style="color:#dc2626">− ${cuadre.devoluciones.toFixed(2)} CUP</span></div>` : ''}
      ${gastos_total > 0 ? `<div class="formula-row"><span>Total gastos</span><span style="color:#dc2626">− ${gastos_total.toFixed(2)} CUP</span></div>` : ''}
      <div class="formula-row total"><span>Esperado en caja</span><span>${cuadre.esperado_efectivo.toFixed(2)} CUP</span></div>
      <div class="formula-row total"><span>Arqueo físico</span><span>${cuadre.arqueo_total.toFixed(2)} CUP</span></div>
      <div class="formula-row total"><span>Diferencia</span><span class="result">${cuadre.diferencia >= 0 ? '+' : ''}${cuadre.diferencia.toFixed(2)} CUP</span></div>
    </div>
  </div>

  ${cuadre.observaciones ? `
  <!-- Observaciones -->
  <div class="obs">
    <strong>Observaciones:</strong> ${cuadre.observaciones}
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <span>ID: ${cuadre.id}</span>
    <span>Impreso: ${printedAt}</span>
  </div>

  <!-- Print button (hidden when printing) -->
  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onClick="window.print()" style="background:#111827;color:#fff;border:none;padding:10px 28px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600">
      🖨️ Imprimir / Guardar como PDF
    </button>
  </div>
</div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}