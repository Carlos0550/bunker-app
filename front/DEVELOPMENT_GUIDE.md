# Guía de Desarrollo del Proyecto Bunker App

Este documento sirve como guía para mantener la consistencia y escalabilidad del proyecto.

## 🏗 Estructura del Proyecto

La estructura actual del proyecto se encuentra en `src/` y se organiza de la siguiente manera:

- **`components/`**: Componentes de React.
  - `ui/`: Componentes base reutilizables (botones, inputs, etc.) provenientes de Shadcn UI. **No modificar directamente a menos que sea necesario.**
  - `layout/`: Componentes estructurales (Sidebar, Header, Layout Principal).
  - `dashboard/`, `products/`, etc.: Componentes específicos de cada funcionalidad o módulo.
- **`pages/`**: Vistas principales de la aplicación que corresponden a rutas (Dashboard, Login, Ventas).
- **`hooks/`**: Hooks personalizados (Lógica reutilizable).
- **`lib/`**: Utilidades y configuraciones de librerías (ej. `utils.ts` para Tailwind).
- **`types/`**: Definiciones de tipos TypeScript compartidos (`index.ts`).
- **`data/`**: Datos simulados (mockData) para desarrollo inicial.

---

## 🚀 ¿Dónde escribo mi código?

### 1. Conexión con Backend (APIs)
La aplicación utiliza **Axios** para las peticiones HTTP. La configuración base se encuentra en `src/api/client.ts`.

1.  **Definición de Servicios**: Crea o edita archivos en **`src/api/services/`**.
2.  **Uso de Mocks**: Actualmente los servicios devuelven datos simulados (mock). Para conectar con el backend real, descomenta el código dentro de cada función de servicio.

```typescript
// Ejemplo src/api/services/products.ts
import client from '../client';

export const productsApi = {
  getAll: async () => {
    // MOCK: Retorna datos simulados
    // return mockProducts;

    // REAL: Descomentar para producción
    const response = await client.get('/products');
    return response.data;
  }
};
```

### 2. Gestión de Estado y Datos (React Query + Zustand)

#### React Query (Estado del Servidor)
Úsalo para manejar la obtención de datos asíncronos (cargas, errores, caché).
-   Crea tus hooks de query en **`src/hooks/queries/`**.
-   Usa los servicios definidos en `src/api/services/`.

```typescript
// Ejemplo src/hooks/queries/useProductsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/services/products';

export const useProductsQuery = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });
};
```

#### Zustand (Estado Global del Cliente)
Para estado global de la aplicación (Autenticación, Carrito de Compras, UI global), usamos **Zustand**.
-   Los stores se encuentran en **`src/store/`**.
-   Ejemplos actuales: `useAuthStore.ts` (Persistente), `useCartStore.ts`.

```typescript
// Ejemplo de uso en componente
import { useCartStore } from '@/store/useCartStore';

const Component = () => {
  const addItem = useCartStore(state => state.addItem);
  // ...
};
```

### 3. Hooks Personalizados (Lógica de UI)
Para lógica de interfaz que no sea datos del servidor (ej. manejar un modal complejo, detectar tamaño de pantalla), usa **`src/hooks/`**.
-   Convención de nombre: `useNombreDelHook.ts`.

### 4. Nuevas Pantallas
1.  Crea el componente de la página en **`src/pages/`**.
2.  Añade la ruta en `src/App.tsx`.
3.  Si requiere navegación en el sidebar, agrégalo en `src/components/layout/AppSidebar.tsx` (o donde se definan los links).

---

## 🛠 Convenciones y Estilos

-   **Estilos**: Usa **Tailwind CSS**. Evita crear archivos `.css` nuevos a menos que sea estrictamente necesario.
-   **Clases Dinámicas**: Usa la utilidad `cn()` (importada de `@/lib/utils`) para combinar clases condicionalmente.
    ```typescript
    <div className={cn("bg-white p-4", isActive && "bg-blue-500")} />
    ```
-   **Formularios**: Usa **React Hook Form** + **Zod** para validación. Define los esquemas de Zod en el mismo archivo del formulario o en una carpeta `src/schemas/` si son reutilizables.

---

## 🆘 Solución de Problemas

### El estilo no se aplica correctamente
-   Verifica que las clases de Tailwind existan.
-   Si es un componente de `ui/`, revisa si `className` se está pasando correctamente a través de `cn()`.

### Error de TypeScript
-   Revisa `src/types/index.ts` para asegurar que las interfaces coincidan con los datos.
-   Si añades librerías, asegúrate de instalar sus tipos (`@types/libreria`).

### La aplicación no carga datos
-   Abre las **DevTools** del navegador (F12).
-   Revisa la pestaña **Network** para ver si fallan las peticiones.
-   Revisa la **Consola** para errores de JavaScript.

### ¿Cómo añado una nueva dependencia?
Usa npm:
```bash
npm install nombre-paquete
```
Si es de desarrollo:
```bash
npm install -D nombre-paquete
```
