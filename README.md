# CuadreCaja

App web progresiva para cuadre de caja diario en pequeños negocios cubanos.

Funciona completamente offline. Los datos se guardan en el dispositivo y no requieren conexión a internet para operar.

---

## Qué hace

Registra y concilia el efectivo de tu negocio al final del turno:

- Inventario de productos vendidos
- Ingresos por transferencias
- Gastos del día
- Arqueo físico de billetes y monedas
- Cálculo automático de diferencias

Todo se guarda localmente. Puedes exportar a CSV o PDF cuando necesites.

---

## Instalación

```bash
npm install
npm run dev
```

La app corre en `http://localhost:4028`

Para producción:

```bash
npm run build
npm start
```

---

## Cómo funciona

### 1. Wizard de cuadre (6 pasos)

1. **Turno**: fecha, cajero, fondo inicial
2. **OCR** (opcional): escanea foto del cuadre anterior para pre-llenar inventario
3. **Inventario**: stock inicial/final de cada producto
4. **Ingresos y gastos**: transferencias, devoluciones, gastos
5. **Arqueo**: conteo físico de billetes
6. **Resumen**: revisión final y guardado

### 2. Historial

- Lista de todos los cuadres guardados
- Filtros por estado (cuadra/faltante/sobrante)
- Búsqueda por cajero, fecha o turno
- Exportar a CSV o imprimir PDF individual
- Importar cuadres desde CSV

### 3. Ajustes

- Nombre del negocio y fondo base
- Lista de cajeros
- Catálogo de productos (para acceso rápido)
- API key de Gemini (para OCR)
- Respaldos automáticos cada 5 minutos
- Exportar/importar respaldo completo en JSON

---

## OCR con Gemini

El paso 2 puede escanear fotos del cuadre anterior (IPV) y extraer productos automáticamente.

Necesitas una API key de Google Gemini (gratis en [aistudio.google.com](https://aistudio.google.com/app/apikey)).

Si no tienes internet o no quieres usar OCR, puedes saltarte este paso.

También incluye Tesseract.js como alternativa offline, aunque es menos preciso.

---

## Modo offline

La app funciona sin conexión:

- Service worker cachea rutas y assets
- Todos los datos en localStorage
- Respaldos automáticos cada 5 minutos
- Página de fallback cuando no hay red

El único requisito de internet es el OCR con Gemini (opcional).

---

## Persistencia de datos

Todo se guarda en `localStorage` con estas claves:

- `mipyme_config` - configuración del negocio
- `mipyme_catalog` - catálogo de productos
- `mipyme_historial` - cuadres guardados
- `mipyme_draft` - borrador del wizard
- `mipyme_backup` - respaldo automático

Cada clave tiene una copia shadow (`_shadow`) para recuperación ante corrupción.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── nuevo-cuadre-wizard/     # Wizard de 6 pasos
│   ├── historial-de-cuadres/    # Lista y detalle de cuadres
│   ├── ajustes/                 # Configuración y respaldos
│   └── layout.tsx               # Layout principal
├── components/
│   ├── AppLayout.tsx            # Header y navegación
│   └── ui/                      # Componentes reutilizables
└── lib/
    └── storage.ts               # Capa de persistencia

public/
├── service-worker.js            # Cache y offline
├── manifest.json                # PWA config
└── offline.html                 # Fallback sin conexión
```

---

## Scripts disponibles

```bash
npm run dev          # Desarrollo (puerto 4028)
npm run build        # Build de producción
npm start            # Servidor de producción
npm run lint         # Revisar código
npm run lint:fix     # Corregir problemas de lint
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```

---

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- Sonner (notificaciones)

---
    
## Instalar como PWA

En móvil:

1. Abre la app en Chrome/Safari
2. Menú → "Añadir a pantalla de inicio"
3. Úsala como app nativa

En escritorio (Chrome):

1. Ícono de instalación en la barra de direcciones
2. Click en "Instalar"

---

## Notas

- Los datos solo existen en el dispositivo donde se crearon
- No hay sincronización entre dispositivos
- Usa los respaldos JSON para migrar datos entre dispositivos
- El OCR funciona mejor con fotos nítidas y buena iluminación
- Tesseract es más lento pero funciona offline

---

## Contribuir

Pull requests bienvenidos. Para cambios grandes, abre un issue primero para discutir qué quieres cambiar.

### Cómo contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/algo-nuevo`)
3. Commit tus cambios (`git commit -m 'Añade algo nuevo'`)
4. Push a la rama (`git push origin feature/algo-nuevo`)
5. Abre un Pull Request

### Guías

- Usa el linter y prettier antes de hacer commit
- Mantén el código simple y legible
- Documenta funciones complejas
- Prueba en modo offline antes de enviar

### Ideas para contribuir

- Mejorar precisión del OCR con Tesseract
- Añadir más opciones de exportación (Excel, etc)
- Soporte para múltiples monedas
- Gráficos de ventas por período
- Modo oscuro
- Sincronización opcional con backend

---

## Licencia

MIT

---

## Contacto

Si encuentras bugs o tienes sugerencias, abre un issue en GitHub.