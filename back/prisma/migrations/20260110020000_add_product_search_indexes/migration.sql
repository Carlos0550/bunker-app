-- Habilitar extensión pg_trgm para búsquedas de texto optimizadas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices GIN para búsquedas parciales rápidas (contains, ILIKE)
-- Estos índices aceleran significativamente las búsquedas por nombre, SKU, código de barras y descripción

-- Índice GIN en name para búsquedas por nombre (el más importante)
CREATE INDEX IF NOT EXISTS "Products_name_gin_idx" ON "Products" USING gin (name gin_trgm_ops);

-- Índice GIN en sku para búsquedas por SKU
CREATE INDEX IF NOT EXISTS "Products_sku_gin_idx" ON "Products" USING gin (sku gin_trgm_ops) WHERE sku IS NOT NULL;

-- Índice GIN en bar_code para búsquedas por código de barras
CREATE INDEX IF NOT EXISTS "Products_bar_code_gin_idx" ON "Products" USING gin (bar_code gin_trgm_ops) WHERE bar_code IS NOT NULL;

-- Índice GIN en description para búsquedas en descripción
CREATE INDEX IF NOT EXISTS "Products_description_gin_idx" ON "Products" USING gin (description gin_trgm_ops) WHERE description IS NOT NULL;

-- Índices funcionales para búsquedas case-insensitive más eficientes
-- Estos índices mejoran el rendimiento cuando se usa lower() en las consultas

CREATE INDEX IF NOT EXISTS "Products_name_lower_idx" ON "Products" (lower(name));
CREATE INDEX IF NOT EXISTS "Products_sku_lower_idx" ON "Products" (lower(sku)) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Products_bar_code_lower_idx" ON "Products" (lower(bar_code)) WHERE bar_code IS NOT NULL;

-- Índice compuesto para búsquedas comunes: businessId + name (case-insensitive)
-- Útil cuando se busca por nombre dentro de un negocio específico
CREATE INDEX IF NOT EXISTS "Products_businessId_name_lower_idx" ON "Products" ("businessId", lower(name));

-- Índice compuesto para filtros comunes: businessId + state + name
-- Optimiza consultas que filtran por negocio, estado y buscan por nombre
CREATE INDEX IF NOT EXISTS "Products_businessId_state_name_idx" ON "Products" ("businessId", state, name) WHERE "deletedAt" IS NULL;
