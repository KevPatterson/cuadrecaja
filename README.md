# CuadreCaja — Cuadre de Caja para MIPYMEs Cubanas

Aplicación web PWA para gestionar el cuadre de caja diario en pequeñas y medianas empresas cubanas. Funciona completamente **offline** con almacenamiento local, sin necesidad de servidor ni conexión permanente a internet.

---

## ✨ Funcionalidades

### 🧾 Wizard de Nuevo Cuadre (6 pasos)
- **Paso 1 — Turno**: Selección de turno (mañana / tarde / noche), nombre del cajero y fecha.
- **Paso 2 — OCR con IA**: Fotografía del cuadre anterior analizada con Google Gemini Vision API para pre-llenar el inventario automáticamente.
- **Paso 3 — Inventario**: Registro de stock inicial, ventas y stock final por producto.
- **Paso 4 — Ingresos y Gastos**: Registro de ingresos adicionales y gastos del turno.
- **Paso 5 — Arqueo**: Conteo de billetes y monedas por denominación.
- **Paso 6 — Resumen**: Resultado del cuadre (cuadra / faltante / sobrante) con exportación a PDF.

### 📋 Historial de Cuadres
- Listado de todos los cuadres guardados con filtro por estado (cuadra / faltante / sobrante).
- Búsqueda por cajero, fecha o turno.
- Modal de detalle con desglose completo y exportación individual a PDF.
- Exportar historial completo a **CSV** (con BOM UTF-8 para Excel).
- Importar / recuperar cuadres desde un archivo CSV.

### ⚙️ Ajustes
- Configuración del negocio (nombre, dirección, RUC).
- Gestión de cajeros.
- Catálogo de productos con CRUD completo.
- Almacenamiento de la API Key de Google Gemini.
- **Copia de seguridad**: descarga JSON del estado completo y restauración desde backup.
- Zona de peligro: borrado total de datos.

### 📶 Indicador de Sincronización Offline
- Badge en la cabecera que muestra el estado de conexión en tiempo real (En línea / Offline).
- Banner toast al perder o recuperar la conexión con mensaje descriptivo.
- La app sigue funcionando completamente sin internet gracias al Service Worker y localStorage.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v3 |
| Iconos | Lucide React |
| IA / OCR | Google Gemini 2.5 Flash Vision API |
| Almacenamiento | localStorage (100 % offline) |
| PWA | Web App Manifest + Service Worker |
| PDF | window.print() con estilos de impresión |

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── nuevo-cuadre-wizard/     # Wizard de 6 pasos
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── StepIndicator.tsx
│   │       ├── Step1Turno.tsx
│   │       ├── Step2OCR.tsx
│   │       ├── Step3Inventario.tsx
│   │       ├── Step4IngresosGastos.tsx
│   │       ├── Step5Arqueo.tsx
│   │       └── Step6Resumen.tsx
│   ├── historial-de-cuadres/    # Historial y exportación
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── CuadreCard.tsx
│   │       └── CuadreModal.tsx
│   ├── ajustes/                 # Configuración y backups
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── ConfigNegocio.tsx
│   │       └── CatalogoCRUD.tsx
│   ├── layout.tsx               # Root layout + PWA meta tags
│   └── page.tsx                 # Redirect a /nuevo-cuadre-wizard
├── components/
│   ├── AppLayout.tsx            # Header, nav, indicador offline
│   └── ui/
│       ├── SyncIndicator.tsx    # Badge + toast de estado de red
│       ├── AppLogo.tsx
│       ├── AppImage.tsx
│       └── AppIcon.tsx
├── lib/
│   └── storage.ts               # CRUD localStorage + auto-backup
└── styles/
    ├── index.css
    └── tailwind.css

public/
├── manifest.json                # PWA manifest
├── service-worker.js            # Cache offline
├── icon-192.png
└── icon-512.png
```

---

## 🚀 Instalación y Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:4028](http://localhost:4028) en tu navegador.

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto 4028) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Verificar calidad de código |
| `npm run format` | Formatear con Prettier |

---

## 📱 PWA — Instalación en Móvil

1. Abre la app en Chrome (Android) o Safari (iOS).
2. Toca **"Añadir a pantalla de inicio"** / **"Add to Home Screen"**.
3. La app se instala como aplicación nativa y funciona sin internet.

---

## 🔑 Configuración de Google Gemini (OCR)

1. Ve a [aistudio.google.com](https://aistudio.google.com) → **Get API key** (gratis).
2. En la app: **Ajustes → API Key de Google Gemini** → pega tu clave.
3. En el Paso 2 del wizard, fotografía el cuadre anterior y la IA extraerá los productos automáticamente.

---

## 💾 Almacenamiento y Backup

Todos los datos se guardan en `localStorage` del navegador:

- `cuadres_historial` — lista de cuadres guardados
- `cuadre_config` — configuración del negocio
- `cuadre_catalogo` — catálogo de productos
- `cuadre_backup_*` — snapshots automáticos cada 5 minutos

Para exportar un backup completo: **Ajustes → Copia de seguridad → Descargar backup JSON**.

---

## 🌐 Demo en Producción

[https://cuadrecaja7449.builtwithrocket.new](https://cuadrecaja7449.builtwithrocket.new)

---

Built with ❤️ on [Rocket.new](https://rocket.new)