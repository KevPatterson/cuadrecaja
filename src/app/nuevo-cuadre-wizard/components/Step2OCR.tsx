'use client';
import React, { useState, useRef } from 'react';
import { Upload, Scan, Key, AlertTriangle, CheckCircle, SkipForward, Eye, EyeOff, X, ImagePlus } from 'lucide-react';
import type { ProductoLine } from '@/lib/storage';
import { toast } from 'sonner';

interface Props {
  apiKey: string;
  onApiKeyChange: (k: string) => void;
  onProductsExtracted: (products: ProductoLine[]) => void;
  onSkip: () => void;
}

interface ImageEntry {
  file: File;
  preview: string;
}

async function scanImage(file: File, apiKey: string): Promise<ProductoLine[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64ImageData = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64ImageData } },
                  {
                    text: `Eres un asistente para un punto de venta en Cuba. Analiza esta imagen de un cuadre de caja del día anterior. Extrae todos los productos con sus existencias finales (stock al cierre) y precios. Devuelve SOLO un JSON válido con este formato exacto, sin markdown ni explicaciones: {"productos":[{"nombre":"string","precio":number,"stock_fin":number}]} Si no puedes leer algún campo, pon null. Si no hay productos visibles, devuelve {"productos":[]}.`
                  }
                ]
              }]
            })
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || 'Error en la API de Google Gemini');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No se pudo extraer JSON de la respuesta');

        const parsed = JSON.parse(jsonMatch[0]);
        const products: ProductoLine[] = (parsed.productos || []).map(
          (p: { nombre: string; precio: number | null; stock_fin: number | null }) => ({
            nombre: p.nombre || '',
            precio: p.precio ?? 0,
            stock_inicio: p.stock_fin ?? 0,
            stock_fin: p.stock_fin ?? 0,
            vendidos: 0,
            subtotal: 0,
          })
        );
        resolve(products);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
  });
}

export default function Step2OCR({ apiKey, onApiKeyChange, onProductsExtracted, onSkip }: Props) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [result, setResult] = useState<ProductoLine[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const newEntries: ImageEntry[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      newEntries.push({ file, preview });
    });
    if (newEntries.length > 0) {
      setImages(prev => [...prev, ...newEntries]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
    setResult(null);
  };

  const handleScan = async () => {
    if (images.length === 0 || !apiKey.trim()) {
      toast.error('Se requiere al menos una imagen y la API key de Google Gemini.');
      return;
    }
    setLoading(true);
    setResult(null);
    const allProducts: ProductoLine[] = [];
    let errors = 0;

    for (let i = 0; i < images.length; i++) {
      setScanProgress({ current: i + 1, total: images.length });
      try {
        const products = await scanImage(images[i].file, apiKey);
        allProducts.push(...products);
      } catch (err: unknown) {
        errors++;
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        toast.error(`Error en imagen ${i + 1}: ${msg}`);
      }
    }

    setScanProgress(null);
    setLoading(false);

    if (allProducts.length > 0) {
      setResult(allProducts);
      const successMsg = errors > 0
        ? `${allProducts.length} productos extraídos (${errors} imagen(es) con error).`
        : `Se extrajeron ${allProducts.length} productos de ${images.length} imagen(es).`;
      toast.success(successMsg);
    } else if (errors === images.length) {
      toast.error('No se pudo procesar ninguna imagen.');
    } else {
      toast.warning('No se encontraron productos en las imágenes.');
    }
  };

  const handleUseResults = () => {
    if (result) {
      onProductsExtracted(result);
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
          Cuadre Anterior (OCR)
        </h2>
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          Sube una o varias fotos del cuadre de ayer para pre-llenar el inventario. Los productos se extraen en el orden de las imágenes. Este paso es opcional.
        </p>
      </div>

      {/* API Key */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Key size={12} />API Key de Google Gemini</span>
        </label>
        <p className="text-xs mb-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
          Se guarda localmente. Obtenla gratis en aistudio.google.com → Get API key
        </p>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            className="input-base pr-10"
            placeholder="AIza..."
            value={apiKey}
            onChange={e => onApiKeyChange(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'hsl(var(--text-muted))' }}
            onClick={() => setShowKey(v => !v)}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Image upload area */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Upload size={12} />Imágenes del cuadre anterior</span>
        </label>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150"
          style={{
            borderColor: images.length > 0 ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
            background: images.length > 0 ? 'hsl(var(--primary-dim))' : 'hsl(var(--surface-2))',
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="space-y-1">
            <ImagePlus size={28} className="mx-auto" style={{ color: 'hsl(var(--text-muted))' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
              {images.length > 0 ? 'Toca para añadir más imágenes' : 'Arrastra o toca para subir imágenes'}
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              JPG, PNG, WEBP · Múltiples imágenes permitidas
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }}
        />

        {/* Image thumbnails list */}
        {images.length > 0 && (
          <div className="mt-3 space-y-2">
            {images.map((img, i) => (
              <div
                key={`img-${i}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={`Imagen ${i + 1}`}
                  className="w-12 h-12 object-cover rounded-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--text-secondary))' }}>
                    {i + 1}. {img.file.name}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                    {(img.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 p-1 rounded-md transition-colors hover:bg-red-500/20"
                  style={{ color: 'hsl(var(--text-muted))' }}
                  onClick={e => { e.stopPropagation(); removeImage(i); }}
                  aria-label={`Eliminar imagen ${i + 1}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scan progress */}
      {scanProgress && (
        <div
          className="rounded-lg px-4 py-3 flex items-center gap-3"
          style={{ background: 'hsl(var(--primary-dim))', border: '1px solid hsl(var(--primary) / 0.3)' }}
        >
          <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: 'hsl(var(--primary-light))' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm" style={{ color: 'hsl(var(--primary-light))' }}>
            Analizando imagen {scanProgress.current} de {scanProgress.total}…
          </p>
        </div>
      )}

      {/* Result preview */}
      {result && (
        <div
          className="rounded-xl p-4 space-y-3 animate-fade-in"
          style={{ background: 'hsl(var(--primary-dim))', border: '1px solid hsl(var(--primary) / 0.3)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'hsl(var(--primary-light))' }} />
            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--primary-light))' }}>
              {result.length} productos extraídos de {images.length} imagen(es)
            </span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
            {result.map((p, i) => (
              <div key={`ocr-result-${i}`} className="flex justify-between text-xs">
                <span style={{ color: 'hsl(var(--text-secondary))' }}>{i + 1}. {p.nombre}</span>
                <span className="font-mono-nums" style={{ color: 'hsl(var(--text-muted))' }}>
                  Stock: {p.stock_inicio}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
      <div
        className="flex gap-2 rounded-lg p-3"
        style={{ background: 'hsl(var(--warning-dim))', border: '1px solid hsl(var(--warning) / 0.2)' }}
      >
        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
        <p className="text-xs" style={{ color: 'hsl(var(--warning))' }}>
          La API key se guarda solo en tu dispositivo. Verifica los datos extraídos antes de continuar.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="btn-primary w-full justify-center"
          disabled={images.length === 0 || !apiKey.trim() || loading}
          onClick={handleScan}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analizando imágenes…
            </>
          ) : (
            <><Scan size={16} />Escanear {images.length > 1 ? `${images.length} imágenes` : 'imagen'} con IA</>
          )}
        </button>

        {result && (
          <button
            type="button"
            className="btn-primary w-full justify-center"
            onClick={handleUseResults}
          >
            <CheckCircle size={16} />
            Usar estos {result.length} productos
          </button>
        )}

        <button
          type="button"
          className="btn-ghost w-full justify-center"
          onClick={onSkip}
        >
          <SkipForward size={16} />
          Saltar, añadir manualmente
        </button>
      </div>
    </div>
  );
}