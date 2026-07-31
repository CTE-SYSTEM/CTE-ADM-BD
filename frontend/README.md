# Frontend CTE

Aplicacion React + Vite del sistema CTE. La estructura principal esta organizada por modulos funcionales en `src/features`.

## Estructura

```txt
frontend/
  src/
    features/        Modulos funcionales principales.
    components/      Componentes realmente compartidos.
    context/         Contextos globales.
    hooks/           Hooks compartidos por varios modulos.
    services/        Infraestructura global de API.
    assets/          Imagenes y recursos estaticos.
    pages/           Paginas globales o pendientes de modularizar.
    main.jsx
    App.jsx
```

## Modulos En `features`

```txt
src/features/
  admin/
  secretaria/
  tecnico/
  tecnicoJefe/
  personalizacion/
  responsive/
```

## Regla De Organizacion

Usa `features/<modulo>` cuando algo pertenece solo a un modulo.

Usa carpetas globales solo si algo se comparte entre varios modulos:

- `src/components`: layout, tablas, navbar, logo, notificaciones compartidas.
- `src/services`: `api.js` y configuracion comun.
- `src/hooks`: hooks usados por varios modulos.
- `src/context`: autenticacion y estado global.

## Admin Pro

```txt
src/features/admin/
  pages/       Pantallas de Admin Pro.
  components/  Componentes propios de Admin.
  services/    Llamadas API de Admin.
  utils/       Exportaciones CSV/PDF y utilidades del modulo.
```

Modificar:

- Paginas: `src/features/admin/pages/`
- API: `src/features/admin/services/`
- Exportar reportes: `src/features/admin/utils/csvExport.js`
- Tarjetas/botones reutilizables: `src/features/admin/components/`

## Secretaria

```txt
src/features/secretaria/
  pages/       Pantallas del modulo.
  components/  Componentes internos.
  services/    Llamadas API de Secretaria.
  legacy/      Versiones antiguas conservadas temporalmente.
```

Modificar:

- Clientes: `pages/Clientes.jsx`
- Equipos: `pages/Equipos.jsx`
- Diagnostico: `pages/Diagnostico.jsx` y `components/Diagnostico/`
- Repuestos: `pages/Repuestos.jsx`
- Compras: `pages/Compras.jsx`
- Facturacion: `pages/Facturacion.jsx`
- Servicios API: `services/`

## Tecnico

```txt
src/features/tecnico/
  pages/
    TecnicoDashboard.jsx
    sections/
      DiagnosticosActivosPage.jsx
      DiagnosticosCompletadosPage.jsx
      OrdenesActivasPage.jsx
      OrdenesCompletadasPage.jsx
      RepuestosTecnicoPage.jsx
      TecnicoSectionRouter.jsx
  components/
  hooks/
  utils/
```

Modificar por seccion:

- Diagnosticos activos: `pages/sections/DiagnosticosActivosPage.jsx`
- Diagnosticos completados: `pages/sections/DiagnosticosCompletadosPage.jsx`
- Ordenes activas: `pages/sections/OrdenesActivasPage.jsx`
- Ordenes completadas: `pages/sections/OrdenesCompletadasPage.jsx`
- Repuestos/piezas: `pages/sections/RepuestosTecnicoPage.jsx`
- Logica y carga de datos: `hooks/useTecnicoDashboard.js`

## Tecnico Jefe

```txt
src/features/tecnicoJefe/
  pages/
    TecnicoJefeDashboard.jsx
    sections/
      DiagnosticosAsignacionPage.jsx
      OrdenesAsignacionPage.jsx
      RepuestosAprobacionPage.jsx
      IrreparablesRevisionPage.jsx
      AlertasRetrasoPage.jsx
      CorreccionesPage.jsx
      TecnicoJefeSectionRouter.jsx
  components/
  hooks/
  services/
  utils/
```

Modificar por boton:

- Diagnosticos: `pages/sections/DiagnosticosAsignacionPage.jsx`
- Ordenes: `pages/sections/OrdenesAsignacionPage.jsx`
- Repuestos: `pages/sections/RepuestosAprobacionPage.jsx`
- Irreparables: `pages/sections/IrreparablesRevisionPage.jsx`
- Alertas: `pages/sections/AlertasRetrasoPage.jsx`
- Correcciones: `pages/sections/CorreccionesPage.jsx`
- Logica general: `hooks/useTecnicoJefeDashboard.js`
- Columnas/tablas: `components/columns.jsx`
- API: `services/`

## Como Agregar Una Pantalla

1. Ubica el modulo en `src/features/<modulo>`.
2. Crea la pantalla en `pages/`.
3. Si es una seccion interna, ponla en `pages/sections/`.
4. Si necesita API, crea o actualiza un servicio en `services/`.
5. Registra la ruta en `src/App.jsx` si es una pagina navegable.

## Como Eliminar Algo

Antes de borrar:

```bash
rg "NombreDelComponente" src
rg "ruta/del/archivo" src
```

Luego elimina:

1. Importaciones.
2. Rutas en `App.jsx`.
3. Servicios/API si ya no se usan.
4. Componentes o hooks internos.

Verifica:

```bash
npm run build
```

## Configuracion

Archivos de raiz que deben quedarse donde estan:

- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.js`
- `eslint.config.js`
- `tailwind.config.cjs`
- `postcss.config.cjs`
- `Dockerfile`
- `nginx.conf.template`
- `.env.example`

Moverlos puede romper Vite, Docker, Tailwind, ESLint o el despliegue.

## Desarrollo

```bash
npm run dev
```

Build:

```bash
npm run build
```

Variable principal:

```txt
VITE_API_URL=/api
```
