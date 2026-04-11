# CuadreCaja

Aplicacion web PWA para el cuadre de caja diario en MIPYMEs cubanas.

Esta app prioriza modo offline y persistencia local: puedes trabajar sin internet, reconectar, y volver a desconectarte sin perder configuracion, borradores ni historial.

## Caracteristicas Principales

- Wizard de nuevo cuadre en 6 pasos.
- OCR opcional con Google Gemini para extraer productos desde imagenes.
- Historial completo con filtros, detalle, exportacion a PDF y CSV, e importacion CSV.
- Ajustes de negocio, cajeros, catalogo y clave de OCR.
- Respaldos JSON con descarga, importacion y restauracion.
- Soporte PWA con service worker y pagina fallback offline.
- Aviso de nueva version disponible con actualizacion controlada por usuario.

## Stack Tecnologico

- Next.js 15 (App Router)
- TypeScript
- React 19
- Tailwind CSS v3
- lucide-react
- sonner (toasts)
- Persistencia: localStorage

## Inicio Rapido

1. Instalar dependencias.

```bash
npm install
```

2. Ejecutar en desarrollo.

```bash
npm run dev
```

3. Abrir en navegador.

- http://localhost:4028

## Scripts

- npm run dev: servidor de desarrollo (puerto 4028)
- npm run build: build de produccion
- npm run start: arranque de app
- npm run lint: revision de lint
- npm run lint:fix: auto-fix de lint
- npm run format: formateo con prettier
- npm run type-check: chequeo TypeScript sin emitir archivos

## Estructura Relevante

```text
src/
    app/
        nuevo-cuadre-wizard/
        historial-de-cuadres/
        ajustes/
        layout.tsx
    components/
        AppLayout.tsx
        ui/
            SyncIndicator.tsx
            ServiceWorkerUpdatePrompt.tsx
    lib/
        storage.ts

public/
    manifest.json
    service-worker.js
    offline.html
```

## Persistencia y Seguridad de Datos

La capa de almacenamiento local esta centralizada en src/lib/storage.ts y aplica medidas para reducir perdida de datos:

- Escritura segura con copia sombra por clave.
- Recuperacion automatica desde copia sombra ante JSON corrupto.
- Guardado de respaldo automatico al actualizar datos clave.
- Respaldo incluye:
    - configuracion
    - catalogo
    - historial
    - borrador del wizard

### Claves de localStorage en uso

- mipyme_config
- mipyme_catalog
- mipyme_historial
- mipyme_draft
- mipyme_backup

Cada una mantiene copia auxiliar con sufijo _shadow para recuperacion.

## Funcionamiento Offline

El service worker en public/service-worker.js implementa:

- Cache de rutas principales y assets criticos.
- Estrategia network-first para navegacion.
- Fallback a cache y a public/offline.html cuando no hay red.
- Estrategia stale-while-revalidate para recursos GET del mismo origen.
- Exclusiones de origen externo (OCR/API de terceros) para evitar cache incorrecto.

## Actualizacion de Nueva Version

El componente src/components/ui/ServiceWorkerUpdatePrompt.tsx:

- Detecta cuando existe un service worker nuevo en estado waiting.
- Muestra banner de nueva version.
- Permite:
    - Actualizar ahora: envia SKIP_WAITING, activa nueva version y recarga.
    - Mas tarde: mantiene version actual sin interrumpir flujo.

Esto evita perder trabajo por recargas forzadas mientras se esta operando.

## Flujo de Respaldos

En Ajustes:

- Descargar respaldo JSON: exporta snapshot completo actual.
- Importar JSON: previsualiza metadatos antes de confirmar reemplazo.
- Restaurar: aplica ultimo respaldo automatico local.

El borrador tambien se restaura para continuar donde quedaste.

## OCR (Paso 2)

- Requiere internet y API key de Google Gemini.
- Si no hay conexion, el paso OCR bloquea escaneo y permite continuar manualmente.
- La clave API se guarda localmente en configuracion del dispositivo.

## Instalacion como PWA

1. Abrir la app en navegador movil compatible.
2. Elegir anadir a pantalla de inicio.
3. Ejecutar como app instalada.

## Verificacion Recomendada de Persistencia

Para validar que no se pierden datos:

1. Crear configuracion, catalogo y un cuadre.
2. Iniciar un borrador y dejarlo a mitad.
3. Desconectar internet y recargar.
4. Verificar que todo sigue visible.
5. Reconectar, navegar, volver a desconectar.
6. Confirmar que datos y borrador se mantienen.
7. Exportar respaldo JSON, borrar datos, importar respaldo y validar restauracion total.

## Demo

https://cuadrecaja7449.builtwithrocket.new