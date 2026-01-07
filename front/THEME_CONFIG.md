# 🎨 Configuración del Tema - Paleta Rojo y Negro

## ✅ Sistema de Colores Global Implementado

### Paleta de Colores

**Rojo (Color Primario):**
- `red.0`: #ffe9e9 (más claro)
- `red.1`: #ffd1d1
- `red.2`: #fba0a1
- `red.3`: #f76d6d
- `red.4`: #f34141
- `red.5`: #f22625 ⭐ (principal)
- `red.6`: #f21616
- `red.7`: #d8080c
- `red.8`: #c10008
- `red.9`: #a90003 (más oscuro)

**Negro/Gris Oscuro:**
- `dark.0` a `dark.9`: Escala de grises de claro a oscuro
- `black.0` a `black.9`: Escala de negro puro

### Componentes Configurados Automáticamente

Todos estos componentes **usan automáticamente el color rojo** sin necesidad de especificarlo:

- ✅ Button
- ✅ Badge  
- ✅ ActionIcon
- ✅ Tabs
- ✅ NavLink
- ✅ ThemeIcon
- ✅ Checkbox
- ✅ Radio
- ✅ Switch
- ✅ Loader
- ✅ Progress
- ✅ Slider
- ✅ Stepper

### Cómo Usar

#### 1. Componentes con Color Automático

```tsx
// ✅ CORRECTO - Usa rojo automáticamente
<Button>Click me</Button>
<Badge>New</Badge>
<Checkbox label="Accept" />

// ❌ NO ES NECESARIO especificar color
<Button color="red">Click me</Button>  // Redundante
```

#### 2. Usar Colores de la Paleta

```tsx
// Usar tonos específicos de rojo
<Box bg="red.5">...</Box>
<Text c="red.7">Error message</Text>
<Button variant="light" color="red">...</Button>

// Usar tonos oscuros
<AppShell.Header bg="dark.9">...</AppShell.Header>
<Paper bg="dark.7">...</Paper>
<Text c="dark.0">Light text</Text>
```

#### 3. Colores en Estilos CSS

```tsx
<div style={{ 
  background: 'var(--mantine-color-red-5)',
  color: 'var(--mantine-color-dark-0)'
}}>
  ...
</div>
```

#### 4. Usar el Hook useMantin eTheme

```tsx
import { useMantineTheme } from '@mantine/core';

function MyComponent() {
  const theme = useMantineTheme();
  
  return (
    <div style={{ 
      background: theme.colors.red[5],
      color: theme.colors.dark[0]
    }}>
      ...
    </div>
  );
}
```

### Configuración Global

La configuración está en:
- **Archivo**: `front/src/styles/theme.ts`
- **Provider**: `front/src/app/providers/ThemeProvider.tsx`
- **Estilos**: `front/src/styles/globals.css`

### Modo Oscuro

El tema está configurado con `defaultColorScheme="dark"` pero soporta cambio automático:

```tsx
// En cualquier componente
import { useMantineColorScheme } from '@mantine/core';

function ThemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  
  return (
    <Button onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}>
      Cambiar Tema
    </Button>
  );
}
```

### Scrollbar Personalizado

El scrollbar está personalizado con los colores del tema:
- Track: Negro (#1a1a1a)
- Thumb: Rojo (#f22625)
- Hover: Rojo claro (#f34141)

### Links y Selección

- **Links**: Color rojo automáticamente
- **Selección de texto**: Fondo rojo con texto blanco

### Ejemplos de Uso

```tsx
// Login/Register (ya configurados)
<Paper bg="dark.7">...</Paper>  // Fondo oscuro
<Button>Iniciar sesión</Button>  // Botón rojo automático

// Header
<AppShell.Header bg="dark.9">  // Negro
  <Text c="white">Bunker App</Text>
</AppShell.Header>

// Navbar
<AppShell.Navbar bg="dark.8">...</AppShell.Navbar>

// Notificaciones
notifications.show({
  title: 'Éxito',
  message: 'Operación completada',
  // No es necesario especificar color, usa rojo automáticamente
});

// Badges de estado
<Badge>Activo</Badge>  // Rojo automático
<Badge color="green">Completado</Badge>  // Override si necesitas otro color

// Tablas
<Table striped highlightOnHover>...</Table>  // Hover en rojo automáticamente
```

### Sobrescribir Color Global

Si necesitas un color diferente para un componente específico:

```tsx
// Sobrescribir el color por defecto
<Button color="green">Aprobar</Button>
<Badge color="blue">Info</Badge>
<Checkbox color="orange" />

// Variantes
<Button variant="light">Light</Button>
<Button variant="outline">Outline</Button>
<Button variant="subtle">Subtle</Button>
<Button variant="filled">Filled</Button>  // Default
```

### Ventajas de Esta Configuración

✅ **Sin repetición**: No necesitas especificar `color="red"` en cada componente  
✅ **Consistencia**: Todos los componentes usan la misma paleta  
✅ **Mantenimiento fácil**: Cambiar colores en un solo lugar  
✅ **Tema oscuro optimizado**: Paleta pensada para dark mode  
✅ **Scrollbar personalizado**: Integrado con los colores del tema  

### Actualizar Colores Globalmente

Si necesitas cambiar la paleta en el futuro, solo edita `front/src/styles/theme.ts`:

```ts
// Cambiar el tono principal de rojo
const red: MantineColorsTuple = [
  // ... tus nuevos tonos
];

// O cambiar el color primario completamente
export const theme = createTheme({
  primaryColor: 'blue',  // Cambiar a azul, verde, etc.
  // ...
});
```

## 🎯 Resultado

Todos los componentes ahora usan **automáticamente** la paleta rojo y negro sin necesidad de configuración manual en cada uno.

