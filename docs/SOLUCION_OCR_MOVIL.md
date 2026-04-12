# Solución: Imagen se queda analizando en móvil con Gemini API

## Problema
Al subir una imagen desde el móvil utilizando la API pública de Gemini, la aplicación se quedaba analizando indefinidamente sin completar el proceso.

## Causas identificadas

1. **Sin timeout**: La llamada fetch a Gemini no tenía un timeout configurado, por lo que podía quedarse esperando indefinidamente
2. **Imágenes pesadas desde móvil**: Las fotos desde móviles modernos pueden ser muy grandes (varios MB), lo que causa:
   - Tiempos de subida largos en conexiones lentas
   - Mayor tiempo de procesamiento en la API
   - Posibles timeouts del servidor
3. **Sin feedback de progreso**: El usuario no sabía si la imagen se estaba procesando o si la app estaba congelada

## Soluciones implementadas

### 1. Timeout de 60 segundos
Se agregó un `AbortController` con timeout de 60 segundos para cancelar la solicitud si tarda demasiado:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);

const response = await fetch(url, {
  signal: controller.signal,
  // ...
});

clearTimeout(timeoutId);
```

### 2. Compresión automática de imágenes
Se creó la función `compressImageForGemini()` que:
- Redimensiona imágenes grandes a máximo 2048px en su lado más largo
- Comprime a JPEG con calidad ajustable
- Reduce el tamaño a ~1MB o menos
- Mantiene suficiente calidad para OCR

```typescript
async function compressImageForGemini(file: File, maxSizeKB: number = 1024): Promise<string>
```

### 3. Mejor manejo de errores
Se agregó detección específica para errores de timeout:

```typescript
if (e instanceof Error && e.name === 'AbortError') {
  reject(new Error('La solicitud a Gemini tardó demasiado (timeout de 60s). Verifica tu conexión o intenta con una imagen más pequeña.'));
}
```

### 4. Feedback mejorado
Se actualizó el mensaje de estado para indicar que la imagen se está preparando:

```
"Preparando imagen y analizando con Gemini AI..."
```

## Beneficios

- ✅ Las imágenes desde móvil se procesan más rápido
- ✅ Menor consumo de datos móviles
- ✅ Timeout claro después de 60 segundos
- ✅ Mensajes de error más descriptivos
- ✅ Mejor experiencia de usuario en conexiones lentas
- ✅ Mantiene la calidad suficiente para OCR

## Pruebas recomendadas

1. Subir foto desde móvil con buena conexión
2. Subir foto desde móvil con conexión lenta (3G)
3. Subir foto muy grande (>5MB)
4. Probar sin conexión (debe mostrar error apropiado)
5. Verificar que el OCR sigue funcionando correctamente

## Notas técnicas

- La compresión se hace en el cliente (navegador) antes de enviar a Gemini
- El timeout de 60s es suficiente para la mayoría de casos, incluso con conexión lenta
- La calidad JPEG se ajusta automáticamente para mantener el tamaño objetivo
- Las imágenes se redimensionan proporcionalmente manteniendo el aspect ratio
