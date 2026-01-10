# Índices de Búsqueda para Productos

Este documento explica los índices agregados a la tabla `Products` para optimizar las búsquedas por nombre y otros campos.

## Extensión pg_trgm

Se habilita la extensión `pg_trgm` de PostgreSQL que permite:
- Búsquedas parciales rápidas (LIKE, ILIKE con `%texto%`)
- Búsquedas de similitud de texto
- Índices GIN optimizados para texto

## Índices GIN (Generalized Inverted Index)

Los índices GIN son ideales para búsquedas de texto parciales:

### 1. `Products_name_gin_idx`
- **Campo**: `name`
- **Tipo**: GIN con pg_trgm
- **Uso**: Búsquedas por nombre con `contains` o `ILIKE '%texto%'`
- **Mejora**: 10-100x más rápido en búsquedas parciales

### 2. `Products_sku_gin_idx`
- **Campo**: `sku`
- **Tipo**: GIN con pg_trgm (parcial, solo donde sku IS NOT NULL)
- **Uso**: Búsquedas por SKU parcial

### 3. `Products_bar_code_gin_idx`
- **Campo**: `bar_code`
- **Tipo**: GIN con pg_trgm (parcial)
- **Uso**: Búsquedas por código de barras parcial

### 4. `Products_description_gin_idx`
- **Campo**: `description`
- **Tipo**: GIN con pg_trgm (parcial)
- **Uso**: Búsquedas en descripción

## Índices Funcionales (lower())

Optimizan búsquedas case-insensitive cuando se usa `lower()`:

### 5. `Products_name_lower_idx`
- **Campo**: `lower(name)`
- **Uso**: Búsquedas case-insensitive por nombre

### 6. `Products_sku_lower_idx`
- **Campo**: `lower(sku)`
- **Uso**: Búsquedas case-insensitive por SKU

### 7. `Products_bar_code_lower_idx`
- **Campo**: `lower(bar_code)`
- **Uso**: Búsquedas case-insensitive por código de barras

## Índices Compuestos

### 8. `Products_businessId_name_lower_idx`
- **Campos**: `businessId`, `lower(name)`
- **Uso**: Búsquedas por nombre dentro de un negocio específico
- **Mejora**: Optimiza el filtro más común (businessId) + búsqueda por nombre

### 9. `Products_businessId_state_name_idx`
- **Campos**: `businessId`, `state`, `name`
- **Filtro**: Solo productos no eliminados (`deletedAt IS NULL`)
- **Uso**: Consultas que filtran por negocio, estado y ordenan/buscan por nombre

## Rendimiento Esperado

### Antes de los índices:
- Búsqueda por nombre: **100-500ms** (escaneo completo de tabla)
- Con muchos productos: puede llegar a **1-2 segundos**

### Después de los índices:
- Búsqueda por nombre: **5-20ms** (uso de índice GIN)
- Mejora: **10-100x más rápido**

## Cuándo se Usan

Los índices se activan automáticamente cuando Prisma genera consultas como:

```typescript
// Esto usa Products_name_gin_idx
{ name: { contains: "coca", mode: "insensitive" } }

// Esto usa Products_businessId_name_lower_idx
{ businessId: "xxx", name: { contains: "coca", mode: "insensitive" } }
```

## Mantenimiento

- Los índices GIN ocupan más espacio que índices B-tree (~2-3x)
- Se actualizan automáticamente al insertar/actualizar productos
- PostgreSQL los mantiene optimizados automáticamente

## Aplicar la Migración

```bash
cd back
npx prisma migrate deploy
```

O en desarrollo:

```bash
npx prisma migrate dev
```
