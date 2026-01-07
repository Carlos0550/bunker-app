# Guía de Desarrollo - Bunker App

Esta guía está diseñada para ayudarte a entender la estructura del proyecto y orientarte sobre dónde realizar cambios o añadir nuevas funcionalidades.

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular basada en **Dominios (Modules)** y **Capas**.

### `src/modules/` (El corazón de la app)
Aquí vive la lógica de negocio dividida por funcionalidades. Cada carpeta representa un módulo autónomo.

*   **Estructura típica de un módulo:**
    *   `pages/`: Vistas completas (ej. `LoginPage.tsx`, `StockListPage.tsx`).
    *   `components/`: Componentes UI específicos de este módulo (ej. `StockTable.tsx`).
    *   `api.ts`: Funciones para llamar al backend relacionadas con este módulo.
    *   `hooks.ts`: Custom hooks para manejar lógica de estado o queries (React Query).
    *   `store.ts`: Estado global del módulo (Zustand) si es necesario.
    *   `types.ts`: Definiciones de TypeScript.

### `src/shared/` (Reutilizable)
Código que se usa en **más de un módulo**. Si creas un botón o una utilidad que usas en Auth y en Stock, va aquí.

*   `components/`: UI Kit genérico (Botones, Modales, Inputs).
*   `hooks/`: Hooks genéricos (ej. `useDebounce`, `useToggle`).
*   `utils/`: Funciones de ayuda puras (formato de fecha, moneda).

### `src/layouts/`
Wrappers que definen la estructura visual de las páginas.
*   `AuthLayout.tsx`: Para Login/Registro (sin sidebar).
*   `AppLayout.tsx`: Para la app principal (con sidebar, header).

### `src/services/`
Configuración global de servicios externos.
*   `http.ts`: Configuración de Axios (interceptores, base URL).
*   `auth.ts`: Manejo de tokens y sesión.

### `src/app/`
Configuración inicial de la aplicación.
*   `router.tsx`: Definición de todas las rutas.
*   `providers/`: Contextos globales (Theme, Auth, QueryClient).

---

## 🛠 Casos de Uso Comunes

### 1. ¿Cómo crear una nueva vista? (Ej. "Reportes")
1.  Crea una carpeta `src/modules/reports/`.
2.  Dentro, crea `pages/ReportsPage.tsx`.
3.  Ve a `src/app/router.tsx` y añade la ruta apuntando a tu nueva página.

### 2. ¿Dónde manejo la autenticación?
*   Si falla el login: Revisa `src/modules/auth/api.ts` o `src/services/auth.ts`.
*   Si quieres cambiar cómo se guarda el token: Ve a `src/services/auth.ts`.
*   Si quieres proteger una ruta: Revisa `src/app/router.tsx` (busca rutas protegidas).

### 3. ¿Cómo conecto con el Backend?
1.  Define la interfaz de los datos en `types.ts` de tu módulo.
2.  Crea la función de llamada en `api.ts` usando la instancia de axios de `src/services/http.ts`.
3.  Crea un hook en `hooks.ts` usando `useQuery` o `useMutation` (React Query) para consumir esa API.

### 4. ¿Dónde pongo mis estilos?
*   Usamos **Mantine UI**. Intenta usar props de estilo (`mt`, `p`, `c`) directamente en los componentes.
*   Para estilos globales: `src/styles/globals.css`.

## 🆘 Solución de Problemas

*   **Error de CORS o API**: Revisa `src/services/http.ts` para ver la `baseURL`.
*   **Problemas de rutas**: Verifica `src/app/router.tsx`.
*   **Componentes rotos**: Revisa si es un componente compartido en `src/shared/components` o específico del módulo.
