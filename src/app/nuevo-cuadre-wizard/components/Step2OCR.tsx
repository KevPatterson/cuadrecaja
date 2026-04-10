'use client';
import React, { useState, useRef } from 'react';
import { Upload, Scan, Key, AlertTriangle, CheckCircle, SkipForward, Eye, EyeOff } from 'lucide-react';
import type { ProductoLine } from '@/lib/storage';
import { toast } from 'sonner';

interface Props {
  apiKey: string;
  onApiKeyChange: (k: string) => void;
  onProductsExtracted: (products: ProductoLine[]) => void;
  onSkip: () => void;
}

export default function Step2OCR({ apiKey, onApiKeyChange, onProductsExtracted, onSkip }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [result, setResult] = useState<ProductoLine[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleScan = async () => {
    if (!imageFile || !apiKey.trim()) {
      toast.error('Se requiere una imagen y la API key de Google Gemini.');
      return;
    }
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        const base64ImageData = (reader.result as string).split(',')[1];
        const mimeType = imageFile.type;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64ImageData
                    }
                  },
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

        // Strip markdown fences if present
        const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No se pudo extraer JSON de la respuesta');

        const parsed = JSON.parse(jsonMatch[0]);
        const products: ProductoLine[] = (parsed.productos || []).map((p: { nombre: string; precio: number | null; stock_fin: number | null }) => ({
          nombre: p.nombre || '',
          precio: p.precio ?? 0,
          stock_inicio: p.stock_fin ?? 0,
          stock_fin: p.stock_fin ?? 0,
          vendidos: 0,
          subtotal: 0,
        }));

        setResult(products);
        toast.success(`Se extrajeron ${products.length} productos del cuadre anterior.`);
        setLoading(false);
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al procesar imagen: ${msg}`);
      setLoading(false);
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
          Sube una foto del cuadre de ayer para pre-llenar el inventario. Este paso es opcional.
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

      {/* Image upload */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Upload size={12} />Imagen del cuadre anterior</span>
        </label>
        <div
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150"
          style={{
            borderColor: imagePreview ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
            background: imagePreview ? 'hsl(var(--primary-dim))' : 'hsl(var(--surface-2))',
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Vista previa del cuadre anterior" className="max-h-40 mx-auto rounded-lg object-contain" />
              <p className="text-xs" style={{ color: 'hsl(var(--primary-light))' }}>{imageFile?.name}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={32} className="mx-auto" style={{ color: 'hsl(var(--text-muted))' }} />
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
                Arrastra o toca para subir imagen
              </p>
              <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>JPG, PNG, WEBP</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>

      {/* Result preview */}
      {result && (
        <div
          className="rounded-xl p-4 space-y-3 animate-fade-in"
          style={{ background: 'hsl(var(--primary-dim))', border: '1px solid hsl(var(--primary) / 0.3)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'hsl(var(--primary-light))' }} />
            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--primary-light))' }}>
              {result.length} productos extraídos
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
            {result.map((p, i) => (
              <div key={`ocr-result-${i}`} className="flex justify-between text-xs">
                <span style={{ color: 'hsl(var(--text-secondary))' }}>{p.nombre}</span>
                <span className="font-mono-nums" style={{ color: 'hsl(var(--text-muted))' }}>
                  Stock inicio: {p.stock_inicio}
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
          disabled={!imageFile || !apiKey.trim() || loading}
          onClick={handleScan}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analizando imagen...
            </>
          ) : (
            <><Scan size={16} />Escanear con IA</>
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