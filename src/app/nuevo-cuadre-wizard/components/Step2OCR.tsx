'use client';
import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Upload, Scan, Key, AlertTriangle, CheckCircle, SkipForward, Eye, EyeOff, X, ImagePlus } from 'lucide-react';
import type { ProductoLine } from '@/lib/storage';
import { toast } from 'sonner';

interface Props {
  apiKey: string;
  savedApiKey?: string;
  onApiKeyChange: (k: string) => void;
  onProductsExtracted: (products: ProductoLine[], fromTesseract?: boolean) => void;
  onSkip: () => void;
}

interface ImageEntry {
  file: File;
  preview: string;
}

type OcrMethod = 'gemini' | 'tesseract';

type TesseractProgressEvent = {
  status?: string;
  progress?: number;
};

type TesseractGlobal = {
  recognize: (
    image: string,
    lang?: string,
    options?: {
      logger?: (message: TesseractProgressEvent) => void;
      tessedit_pageseg_mode?: string;
      tessedit_ocr_engine_mode?: string;
      preserve_interword_spaces?: string;
      tessedit_char_whitelist?: string;
    }
  ) => Promise<{ data: { text: string; confidence?: number } }>;
};

const SHARED_GEMINI_KEY = (process.env.NEXT_PUBLIC_GEMINI_SHARED_KEY || '').trim();

function isGeminiDailyLimitError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('429')
  );
}

function getGeminiGuidance(message: string): string | null {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('api_key_invalid') ||
    normalized.includes('api key not valid') ||
    normalized.includes('invalid api key')
  ) {
    return 'La API key de Gemini no es valida. Verifica la clave o crea una nueva en Google AI Studio.';
  }

  if (
    normalized.includes('api_key_http_referrer_blocked') ||
    normalized.includes('referer')
  ) {
    return 'La API key esta restringida por dominio. Agrega el dominio desplegado en los referrers permitidos de Google Cloud.';
  }

  if (
    normalized.includes('permission_denied') ||
    normalized.includes('service_disabled')
  ) {
    return 'La API key no tiene permiso para Gemini. Habilita Generative Language API en el proyecto de Google Cloud.';
  }

  if (
    normalized.includes('payload') ||
    normalized.includes('request too large') ||
    normalized.includes('too large') ||
    normalized.includes('entity too large')
  ) {
    return 'La imagen es demasiado grande para Gemini. Comprime la imagen o usa una foto de menor resolucion.';
  }

  return null;
}

declare global {
  interface Window {
    Tesseract?: TesseractGlobal;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toNonNegativeInt(value: unknown): number | null {
  const num = toNumber(value);
  if (num == null) return null;
  return Math.max(0, Math.round(num));
}

function toNonNegativeNumber(value: unknown): number | null {
  const num = toNumber(value);
  if (num == null) return null;
  return Math.max(0, num);
}

function parseTableFromRawText(rawText: string): { productos: Array<{ nombre: string; precio: number; stock_fin: number }> } {
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 2);
  const productos: Array<{ nombre: string; precio: number; stock_fin: number }> = [];

  const skipKeywords = [
    'producto', 'precio', 'stock', 'inicio', 'fin', 'vendido',
    'total', 'cuadre', 'fecha', 'cajero', 'fondo', 'turno',
    'cup', 'transferencia', 'apertura', 'cierre', 'dia', 'día'
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (skipKeywords.some(keyword => lower.includes(keyword))) continue;

    const numbers = [...line.matchAll(/\b\d+([.,]\d+)?\b/g)].map(match =>
      Number.parseFloat(match[0].replace(',', '.'))
    );
    if (numbers.length < 2) continue;

    const firstNumIndex = line.search(/\d/);
    if (firstNumIndex < 2) continue;

    let nombre = line
      .substring(0, firstNumIndex)
      .replace(/[|:;\-_\/\\]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (nombre.length < 2 || /^[\W\d]+$/.test(nombre)) continue;

    const precio = numbers[0] || 0;
    let stock_fin = 0;
    if (numbers.length >= 5) {
      stock_fin = numbers[2] || 0;
    } else if (numbers.length === 4) {
      stock_fin = numbers[2] || 0;
    } else if (numbers.length === 3) {
      const second = numbers[1] || 0;
      const third = numbers[2] || 0;
      const secondIsIntLike = Math.abs(second - Math.round(second)) < 0.01;
      const thirdIsIntLike = Math.abs(third - Math.round(third)) < 0.01;

      if (secondIsIntLike && !thirdIsIntLike) {
        stock_fin = second;
      } else if (!secondIsIntLike && thirdIsIntLike) {
        stock_fin = third;
      } else if (third >= Math.max(30, precio * 2) && second < third) {
        // En muchos cuadres el tercer numero puede ser total monetario.
        stock_fin = second;
      } else {
        stock_fin = third;
      }
    } else if (numbers.length >= 2) {
      stock_fin = numbers[1] || 0;
    }

    if (precio > 100000 || stock_fin > 10000) continue;
    if (precio === 0 && stock_fin === 0) continue;

    productos.push({
      nombre,
      precio,
      stock_fin,
    });
  }

  return { productos };
}

function dedupeProducts(
  productos: Array<{ nombre: string; precio: number; stock_fin: number }>
): Array<{ nombre: string; precio: number; stock_fin: number }> {
  const byName = new Map<string, { nombre: string; precio: number; stock_fin: number }>();

  for (const prod of productos) {
    const key = prod.nombre.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key) continue;

    const current = byName.get(key);
    if (!current) {
      byName.set(key, prod);
      continue;
    }

    const currentScore = (current.precio > 0 ? 1 : 0) + (current.stock_fin >= 0 ? 1 : 0);
    const nextScore = (prod.precio > 0 ? 1 : 0) + (prod.stock_fin >= 0 ? 1 : 0);
    if (nextScore > currentScore) {
      byName.set(key, prod);
    }
  }

  return Array.from(byName.values());
}

type PreprocessOptions = {
  threshold?: number;
  contrast?: number;
  scale?: number;
};

type PreprocessedVariant = {
  label: string;
  dataUrl: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function compressImageForGemini(file: File, maxSizeKB: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Reducir dimensiones si la imagen es muy grande
        const maxDimension = 2048;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo comprimir la imagen.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Intentar con diferentes calidades hasta conseguir el tamaño deseado
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo para compresión.'));
  });
}

function preprocessImage(imageDataUrl: string, options?: PreprocessOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = options?.scale ?? 2;
      const contrast = options?.contrast ?? 1.3;
      const threshold = options?.threshold;

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo preparar la imagen para OCR.'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const contrasted = clamp((gray - 128) * contrast + 128, 0, 255);

        if (typeof threshold === 'number') {
          const bw = contrasted < threshold ? 0 : 255;
          data[i] = bw;
          data[i + 1] = bw;
          data[i + 2] = bw;
        } else {
          data[i] = contrasted;
          data[i + 1] = contrasted;
          data[i + 2] = contrasted;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen para OCR.'));
    img.src = imageDataUrl;
  });
}

async function buildPreprocessedVariants(imageDataUrl: string): Promise<PreprocessedVariant[]> {
  const [highContrastBW, darkerBW, grayscale] = await Promise.all([
    preprocessImage(imageDataUrl, { threshold: 140, contrast: 1.35, scale: 2 }),
    preprocessImage(imageDataUrl, { threshold: 120, contrast: 1.5, scale: 2 }),
    preprocessImage(imageDataUrl, { contrast: 1.2, scale: 2 }),
  ]);

  return [
    { label: 'bw-140', dataUrl: highContrastBW },
    { label: 'bw-120', dataUrl: darkerBW },
    { label: 'gray', dataUrl: grayscale },
  ];
}

function scoreParsedProducts(
  productos: Array<{ nombre: string; precio: number; stock_fin: number }>,
  confidence?: number
): number {
  if (productos.length === 0) return -1;

  let goodRows = 0;
  let suspiciousRows = 0;

  for (const prod of productos) {
    const hasLetters = /[a-záéíóúüñ]/i.test(prod.nombre);
    const reasonablePrice = prod.precio > 0 && prod.precio <= 100000;
    const reasonableStock = prod.stock_fin >= 0 && prod.stock_fin <= 10000;

    if (hasLetters && reasonablePrice && reasonableStock) {
      goodRows++;
    } else {
      suspiciousRows++;
    }
  }

  const confidenceBoost = typeof confidence === 'number' ? Math.max(0, confidence) / 5 : 0;
  return goodRows * 25 - suspiciousRows * 15 + confidenceBoost;
}

async function runOCRTesseract(
  imageDataUrl: string,
  onProgress?: (pct: number) => void
): Promise<{ productos: Array<{ nombre: string; precio: number; stock_fin: number }> }> {
  if (typeof window === 'undefined' || !window.Tesseract) {
    throw new Error('No se pudo cargar Tesseract. Verifica tu conexion y recarga la pagina.');
  }

  const variants = await buildPreprocessedVariants(imageDataUrl);
  const psmModes = ['6', '4'];
  const totalPasses = variants.length * psmModes.length;

  let bestProductos: Array<{ nombre: string; precio: number; stock_fin: number }> = [];
  let bestScore = -1;

  for (let vIdx = 0; vIdx < variants.length; vIdx++) {
    for (let pIdx = 0; pIdx < psmModes.length; pIdx++) {
      const passIndex = vIdx * psmModes.length + pIdx;
      const baseProgress = passIndex / totalPasses;

      const { data } = await window.Tesseract.recognize(variants[vIdx].dataUrl, 'spa', {
        logger: message => {
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            const overall = Math.round((baseProgress + (message.progress / totalPasses)) * 100);
            const statusEl = document.getElementById('ocr-status');
            if (statusEl) statusEl.textContent = `Analizando... ${overall}%`;
            onProgress?.(overall);
          }
        },
        tessedit_pageseg_mode: psmModes[pIdx],
        tessedit_ocr_engine_mode: '1',
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóúüñÁÉÍÓÚÜÑ0123456789.,: -/'
      });

      const parsed = parseTableFromRawText(data.text);
      const deduped = dedupeProducts(parsed.productos);
      const score = scoreParsedProducts(deduped, data.confidence);

      if (score > bestScore) {
        bestScore = score;
        bestProductos = deduped;
      }
    }
  }

  onProgress?.(100);
  return { productos: bestProductos };
}

async function scanImage(file: File, apiKey: string): Promise<ProductoLine[]> {
  try {
    console.log('Iniciando scanImage con API key:', apiKey.substring(0, 10) + '...');
    console.log('Tamaño del archivo:', (file.size / 1024).toFixed(2), 'KB');
    
    // Leer imagen como base64
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });

    // Comprimir si es necesario
    let finalDataUrl = dataUrl;
    const fileSizeKB = file.size / 1024;
    
    if (fileSizeKB > 800) {
      console.log('Comprimiendo imagen...');
      try {
        finalDataUrl = await compressImageForGemini(file, 800);
        const compressedSize = (finalDataUrl.length * 0.75) / 1024;
        console.log('Imagen comprimida a:', compressedSize.toFixed(2), 'KB');
      } catch (compressError) {
        console.warn('No se pudo comprimir, usando imagen original:', compressError);
      }
    }

    const base64ImageData = finalDataUrl.split(',')[1];
    const mimeType = finalDataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 
                     finalDataUrl.startsWith('data:image/png') ? 'image/png' : 
                     finalDataUrl.startsWith('data:image/webp') ? 'image/webp' : file.type;

    console.log('MIME type:', mimeType);
    console.log('Tamaño base64:', (base64ImageData.length / 1024).toFixed(2), 'KB');

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      
      console.log('Enviando solicitud a Gemini...');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
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
                text: `Actua como extractor OCR estructurado para un punto de venta en Cuba.

Analiza la imagen del cuadre de caja y extrae por cada producto: nombre, precio, stock inicial, stock final, vendidos y total.

Responde UNICAMENTE con JSON valido (sin markdown, sin comentarios, sin texto extra) usando EXACTAMENTE este esquema:
{"productos":[{"nombre":"string","precio":number|null,"stock_inicio":number|null,"stock_fin":number|null,"vendidos":number|null,"total":number|null}]}

Reglas obligatorias:
1) No agregues claves fuera de: productos, nombre, precio, stock_inicio, stock_fin, vendidos, total.
2) Si un valor no es legible o es ambiguo, usa null.
3) precio y total deben ser numeros (sin simbolos de moneda ni separadores de miles). Si no se pueden inferir con certeza, null.
4) stock_inicio, stock_fin y vendidos deben ser numeros enteros. Si no se pueden inferir con certeza, null.
5) No inventes productos. Solo incluye los que aparezcan visibles en la imagen.
6) Si no hay productos visibles, responde exactamente: {"productos":[]}.
7) Devuelve un solo objeto JSON raiz.`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        })
      });

      clearTimeout(timeoutId);
      console.log('Respuesta recibida, status:', response.status);

      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}`;
        
        try {
          const errorText = await response.text();
          console.error('Error de Gemini:', errorText);
          const errorData = JSON.parse(errorText);
          
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.error?.status) {
            errorMessage = errorData.error.status;
          }
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Datos recibidos de Gemini');
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini no devolvió resultados. La imagen puede ser muy compleja o no contener texto legible.');
      }

      const text = data.candidates[0]?.content?.parts?.[0]?.text || '';
      
      if (!text) {
        throw new Error('Respuesta vacía de Gemini');
      }

      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
      }

      const parsed: { productos?: unknown } = JSON.parse(jsonMatch[0]);
      const rawProducts: Record<string, unknown>[] = (Array.isArray(parsed.productos) ? parsed.productos : []).filter(
        (item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null
      );

      const products: ProductoLine[] = rawProducts.map((p: Record<string, unknown>) => {
        const nombre = typeof p.nombre === 'string' ? p.nombre.trim() : '';
        const precio = toNonNegativeNumber(p.precio) ?? 0;

        const stockInicioParsed = toNonNegativeInt(p.stock_inicio);
        const stockFinParsed = toNonNegativeInt(p.stock_fin);
        const vendidosParsed = toNonNegativeInt(p.vendidos);
        const totalParsed = toNonNegativeNumber(p.total);

        const stock_inicio = stockInicioParsed ?? 0;
        const stock_fin = stockFinParsed ?? 0;

        let vendidos = vendidosParsed;
        if (vendidos == null && stockInicioParsed != null && stockFinParsed != null) {
          vendidos = Math.max(0, stockInicioParsed - stockFinParsed);
        }
        if (vendidos == null) vendidos = 0;

        let subtotal = totalParsed;
        if (subtotal == null) {
          subtotal = precio * vendidos;
        }

        return {
          nombre,
          precio,
          stock_inicio,
          stock_fin,
          vendidos,
          subtotal,
        };
      }).filter((p: ProductoLine) => p.nombre.length > 0);
      
      console.log('Productos extraídos:', products.length);
      return products;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Error en fetch:', fetchError);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado (2 minutos). Intenta con una imagen más pequeña o verifica tu conexión.');
        }
        
        const errorMsg = fetchError.message.toLowerCase();
        
        if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror') || errorMsg.includes('network request failed')) {
          throw new Error('No se pudo conectar con Gemini. Verifica tu conexión a internet y que la API key sea válida.');
        }
        
        if (errorMsg.includes('api_key_invalid') || errorMsg.includes('invalid api key')) {
          throw new Error('API key inválida. Verifica tu clave en Google AI Studio.');
        }
        
        if (errorMsg.includes('quota') || errorMsg.includes('resource_exhausted')) {
          throw new Error('Límite de uso alcanzado. Intenta más tarde o usa otra API key.');
        }
      }
      
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al procesar la imagen con Gemini');
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
  });
}

async function scanImageWithTesseract(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ProductoLine[]> {
  const imageDataUrl = await fileToDataUrl(file);
  const result = await runOCRTesseract(imageDataUrl, onProgress);

  return result.productos
    .map(p => {
      const precio = toNonNegativeNumber(p.precio) ?? 0;
      const stockInicio = toNonNegativeInt(p.stock_fin) ?? 0;
      const stockFin = 0;
      const vendidos = Math.max(0, stockInicio - stockFin);

      return {
        nombre: p.nombre || '',
        precio,
        stock_inicio: stockInicio,
        stock_fin: stockFin,
        vendidos,
        subtotal: Number((vendidos * precio).toFixed(2)),
      };
    })
    .filter(p => p.nombre.length > 0);
}

export default function Step2OCR({ apiKey, savedApiKey, onApiKeyChange, onProductsExtracted, onSkip }: Props) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number } | null>(null);
  const [ocrMethod, setOcrMethod] = useState<OcrMethod>('tesseract');
  const [ocrStatus, setOcrStatus] = useState('');
  const [usedMethodInResult, setUsedMethodInResult] = useState<OcrMethod | null>(null);
  const [useSharedKey, setUseSharedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [result, setResult] = useState<ProductoLine[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const normalizedCurrentKey = apiKey.trim();
  const normalizedSavedKey = (savedApiKey || '').trim();
  const canUseSavedKey = normalizedSavedKey.length > 0 && normalizedSavedKey !== normalizedCurrentKey;
  const geminiEnabled = ocrMethod === 'gemini';
  const hasSharedGeminiKey = SHARED_GEMINI_KEY.length > 0;
  const effectiveGeminiKey = useSharedKey ? SHARED_GEMINI_KEY : normalizedCurrentKey;

  useEffect(() => {
    const hasGeminiKey = normalizedSavedKey.length > 0;
    const shouldUseGeminiByDefault = hasGeminiKey || hasSharedGeminiKey;
    if (!shouldUseGeminiByDefault) return;

    setOcrMethod('gemini');
    if (!hasGeminiKey && hasSharedGeminiKey) {
      setUseSharedKey(true);
      console.log('Usando clave compartida de Gemini:', SHARED_GEMINI_KEY.substring(0, 10) + '...');
    }
  }, [normalizedSavedKey, hasSharedGeminiKey]);

  const MAX_IMAGE_SIZE_MB = 4;
  const addFiles = (files: FileList | File[]) => {
    const newEntries: ImageEntry[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`La imagen "${file.name}" supera el límite de ${MAX_IMAGE_SIZE_MB}MB. Usa una imagen más pequeña.`);
        setOcrStatus(`La imagen "${file.name}" supera el límite de ${MAX_IMAGE_SIZE_MB}MB. Usa una imagen más pequeña o reduce la resolución.`);
        return;
      }
      const preview = URL.createObjectURL(file);
      newEntries.push({ file, preview });
    });
    if (newEntries.length > 0) {
      setImages(prev => [...prev, ...newEntries]);
      setResult(null);
      setUsedMethodInResult(null);
      setOcrStatus('');
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
    setUsedMethodInResult(null);
    setOcrStatus('');
  };

  const handleScan = async () => {
    if (images.length === 0) {
      toast.error('Se requiere al menos una imagen.');
      return;
    }

    if (geminiEnabled && !effectiveGeminiKey) {
      toast.error('Introduce tu API Key o activa la clave compartida de Gemini.');
      return;
    }

    if (geminiEnabled && !navigator.onLine) {
      toast.error('Sin conexion: el OCR requiere internet. Puedes saltar este paso y continuar manualmente.');
      return;
    }

    setLoading(true);
    setResult(null);
    setUsedMethodInResult(null);
    setOcrStatus('');
    const allProducts: ProductoLine[] = [];
    let errors = 0;

    for (let i = 0; i < images.length; i++) {
      setScanProgress({ current: i + 1, total: images.length });
      try {
        let products: ProductoLine[] = [];
        if (geminiEnabled) {
          const sizeKB = Math.round(images[i].file.size / 1024);
          setOcrStatus(
            useSharedKey 
              ? `Procesando imagen ${i + 1}/${images.length} (${sizeKB}KB) con Gemini AI (clave compartida)...` 
              : `Procesando imagen ${i + 1}/${images.length} (${sizeKB}KB) con Gemini AI...`
          );
          products = await scanImage(images[i].file, effectiveGeminiKey);
        } else {
          setOcrStatus('Cargando motor de analisis...');
          products = await scanImageWithTesseract(images[i].file, pct => {
            setOcrStatus(`Analizando... ${pct}%`);
          });
        }
        allProducts.push(...products);
      } catch (err: unknown) {
        errors++;
        const msg = err instanceof Error ? err.message : 'Error desconocido';

        if (geminiEnabled) {
          if (useSharedKey && isGeminiDailyLimitError(msg)) {
            const dailyLimitMsg = 'La clave compartida de Gemini alcanzó el limite diario. Cambia a Tesseract, usa tu propia API key o espera al siguiente dia.';
            setOcrStatus(dailyLimitMsg);
            toast.warning('Limite diario alcanzado en clave compartida. Usa Tesseract, tu API key o espera al proximo dia.');
          } else {
            const guidance = getGeminiGuidance(msg);
            if (guidance) {
              setOcrStatus(guidance);
              toast.warning(guidance);
            }
          }
        }

        setOcrStatus(`Error Gemini: ${msg}`);
        toast.error(`Error en imagen ${i + 1}: ${msg}`);
      }
    }

    setScanProgress(null);
    setLoading(false);

    if (allProducts.length > 0) {
      setResult(allProducts);
      setUsedMethodInResult(ocrMethod);
      const successMsg = errors > 0
        ? `${allProducts.length} productos extraídos (${errors} imagen(es) con error).`
        : `Se extrajeron ${allProducts.length} productos de ${images.length} imagen(es).`;
      setOcrStatus(`${allProducts.length} productos detectados. Revisa y corrige si es necesario.`);
      toast.success(successMsg);
    } else if (errors === images.length) {
      setOcrStatus('Error durante el analisis. Revisa las imagenes e intenta de nuevo.');
      toast.error('No se pudo procesar ninguna imagen.');
    } else {
      setOcrStatus('No se detectaron productos. Puedes añadirlos manualmente en el paso siguiente.');
      toast.warning('No se encontraron productos en las imágenes.');
    }
  };

  const handleUseResults = () => {
    if (result) {
      onProductsExtracted(result, usedMethodInResult === 'tesseract' && result.length > 0);
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <Script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" strategy="lazyOnload" />

      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
          Cuadre anterior (OCR)
        </h2>
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          Sube una o varias fotos del cuadre (IPV) de ayer para pre-llenar el inventario. Los productos se extraen en el orden de las imágenes. Este paso es opcional.
        </p>
      </div>

      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Scan size={12} />Como quieres analizar el cuadre?</span>
        </label>
        <div className="space-y-2">
          <label
            className="block p-3 cursor-pointer transition-colors"
            style={{
              border: ocrMethod === 'gemini' ? '2px solid var(--ink)' : '2px solid hsl(var(--text-muted))',
              background: ocrMethod === 'gemini' ? 'var(--bg-alt)' : 'var(--bg)',
            }}
          >
            <div className="flex items-start gap-2">
              <input
                type="radio"
                name="ocr-method"
                value="gemini"
                checked={ocrMethod === 'gemini'}
                onChange={() => setOcrMethod('gemini')}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Con Gemini AI (recomendado)
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                  Alta precision con letra manuscrita. Requiere API Key gratuita. Análisis en la nube de Google, no en tu dispositivo. Si no tienes clave API, puedes seleccionar esta opción y se usará una clave compartida con límites de uso diarios. Si alcanzas el límite, puedes cambiar a Tesseract o esperar al siguiente día para que se restablezca el límite.
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
                  Obtenla gratis en{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 transition-colors"
                    style={{ color: 'var(--ink)' }}
                  >
                    aistudio.google.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </label>

          <label
            className="block p-3 cursor-pointer transition-colors"
            style={{
              border: ocrMethod === 'tesseract' ? '2px solid var(--ink)' : '2px solid hsl(var(--text-muted))',
              background: ocrMethod === 'tesseract' ? 'var(--bg-alt)' : 'var(--bg)',
            }}
          >
            <div className="flex items-start gap-2">
              <input
                type="radio"
                name="ocr-method"
                value="tesseract"
                checked={ocrMethod === 'tesseract'}
                onChange={() => setOcrMethod('tesseract')}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Sin API Key (Tesseract)
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                  Funciona offline, sin cuenta. Mejor con texto impreso. Menor precision con letra manuscrita o tablas complejas. Requiere más pasos de correccion manual en el paso siguiente.
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Clave API */}
      {geminiEnabled ? (
        <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Key size={12} />Clave API de Google Gemini</span>
        </label>
        {!hasSharedGeminiKey && !normalizedCurrentKey && (
          <div
            className="p-3 mb-2"
            style={{ background: 'var(--bg-alt)', border: '2px solid var(--amber)' }}
          >
            <p className="text-xs" style={{ color: 'var(--amber)' }}>
              En este despliegue no hay clave compartida configurada. Define NEXT_PUBLIC_GEMINI_SHARED_KEY en tu plataforma y vuelve a desplegar.
            </p>
          </div>
        )}
        {hasSharedGeminiKey && (
          <label className="flex items-center gap-2 text-xs mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>
            <input
              type="checkbox"
              checked={useSharedKey}
              onChange={e => setUseSharedKey(e.target.checked)}
            />
            Usar clave compartida (limite diario)
          </label>
        )}
        {useSharedKey ? (
          <div
            className="p-3 mb-2"
            style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
          >
            <p className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>
              Estás usando la clave compartida de Gemini con limite diario. Si se agota, cambia a Tesseract, usa tu propia API key o espera al siguiente dia.
            </p>
          </div>
        ) : (
          <>
        <p className="text-xs mb-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
          Se guarda localmente. Obténla gratis en {' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors"
            style={{ color: 'var(--ink)' }}
          >
            aistudio.google.com
          </a>
          {' '}
          → Obtener clave API
        </p>
        {canUseSavedKey && (
          <button
            type="button"
            className="text-xs mb-2 px-2 py-1 border transition-colors w-full sm:w-auto"
            style={{
              color: 'var(--ink)',
              borderColor: 'var(--ink)',
              background: 'var(--bg-alt)',
            }}
            onClick={() => {
              onApiKeyChange(normalizedSavedKey);
              toast.success('Se cargó la clave API guardada.');
            }}
          >
            Usar clave API guardada
          </button>
        )}
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
          </>
        )}
      </div>
      ) : (
        <div
          className="p-3"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <p className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>
            El analisis se hace en tu dispositivo. Funciona mejor con tablas impresas. Para letra manuscrita, los resultados pueden requerir correccion manual.
          </p>
        </div>
      )}

      {/* Image upload area */}
      <div>
        <label className="label">
          <span className="flex items-center gap-1.5"><Upload size={12} />Imágenes del cuadre anterior</span>
        </label>
        <p className="text-xs mb-2" style={{ color: 'hsl(var(--text-muted))' }}>
          Imágenes de hasta 4 MB. Si tu imagen es mayor, redúcela o toma una foto con menor resolución.
        </p>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-150"
          style={{
            borderColor: 'var(--ink)',
            background: images.length > 0 ? 'var(--bg-alt)' : 'var(--bg)',
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
                className="flex items-center gap-3 px-3 py-2"
                style={{ background: 'var(--bg)', border: '2px solid var(--ink)' }}
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
                  className="shrink-0 p-1 transition-colors hover:bg-red-500/20"
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
          className="px-4 py-3 flex items-center gap-3"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--ink)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--ink)' }}>
            Analizando imagen {scanProgress.current} de {scanProgress.total}…
          </p>
        </div>
      )}

      {!!ocrStatus && (
        <div
          id="ocr-status"
          className="px-4 py-3 text-sm"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)', color: 'var(--ink)' }}
        >
          {ocrStatus}
        </div>
      )}

      {/* Result preview */}
      {result && (
        <div
          className="p-4 space-y-3 animate-fade-in"
          style={{ background: 'var(--bg-alt)', border: '2px solid var(--ink)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'var(--ink)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {result.length} productos extraídos de {images.length} imagen(es)
            </span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
            {result.map((p, i) => (
              <div
                key={`ocr-result-${i}`}
                className="p-2.5 text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--ink)' }}
              >
                <p className="font-medium mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>
                  {i + 1}. {p.nombre}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 font-mono-nums" style={{ color: 'hsl(var(--text-muted))' }}>
                  <span>Stock inicial: {p.stock_inicio}</span>
                  <span>Stock final: {p.stock_fin}</span>
                  <span>Vendidos: {p.vendidos}</span>
                  <span>Total: {p.subtotal.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {usedMethodInResult === 'tesseract' && result.length > 0 && (
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              Revisa los productos detectados antes de continuar: Tesseract puede cometer errores con letra manuscrita o tablas complejas. Puedes editar cualquier valor directamente en el paso 3.
            </p>
          )}
        </div>
      )}

      {/* Warning */}
      <div
        className="flex gap-2 p-3"
        style={{ background: 'var(--bg-alt)', border: '2px solid var(--amber)' }}
      >
        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--amber)' }} />
        <p className="text-xs" style={{ color: 'var(--amber)' }}>
          La clave API se guarda solo en tu dispositivo. Verifica los datos extraídos antes de continuar.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="btn-primary w-full justify-center"
          disabled={images.length === 0 || (geminiEnabled && !effectiveGeminiKey) || loading}
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
            <>
              <Scan size={16} />
              Escanear {images.length > 1 ? `${images.length} imágenes` : 'imagen'} {geminiEnabled ? 'con Gemini AI' : 'con Tesseract'}
            </>
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