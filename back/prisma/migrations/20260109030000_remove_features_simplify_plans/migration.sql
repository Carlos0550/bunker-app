-- Eliminar tablas de features si existen
DROP TABLE IF EXISTS "PlanFeature";
DROP TABLE IF EXISTS "Feature";

-- Eliminar enum FeatureValueType si existe
DROP TYPE IF EXISTS "FeatureValueType";

-- Agregar columnas faltantes a BusinessPlan
ALTER TABLE "BusinessPlan" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BusinessPlan" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "BusinessPlan" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "BusinessPlan" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Hacer businessPlanId requerido en Business
-- Primero, asegurarnos de que todos los negocios tengan un plan asignado
DO $$
DECLARE
  default_plan_id TEXT;
BEGIN
  -- Obtener o crear un plan por defecto
  SELECT id INTO default_plan_id FROM "BusinessPlan" WHERE "isActive" = true LIMIT 1;
  
  IF default_plan_id IS NULL THEN
    -- Crear un plan por defecto si no existe ninguno activo
    INSERT INTO "BusinessPlan" (id, name, price, features, "isActive", description, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::TEXT,
      'Plan Estándar',
      0,
      ARRAY[]::TEXT[],
      true,
      'Plan por defecto',
      NOW(),
      NOW()
    )
    RETURNING id INTO default_plan_id;
  END IF;
  
  -- Asignar el plan por defecto a todos los negocios sin plan
  UPDATE "Business"
  SET "businessPlanId" = default_plan_id
  WHERE "businessPlanId" IS NULL;
END $$;

-- Hacer businessPlanId NOT NULL (solo si la columna existe y tiene valores)
DO $$
BEGIN
  -- Solo hacer NOT NULL si no hay valores NULL
  IF NOT EXISTS (SELECT 1 FROM "Business" WHERE "businessPlanId" IS NULL) THEN
    ALTER TABLE "Business" ALTER COLUMN "businessPlanId" SET NOT NULL;
  END IF;
END $$;

-- Agregar constraint de foreign key si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Business_businessPlanId_fkey'
  ) THEN
    ALTER TABLE "Business"
      ADD CONSTRAINT "Business_businessPlanId_fkey" 
      FOREIGN KEY ("businessPlanId") 
      REFERENCES "BusinessPlan"("id") 
      ON DELETE RESTRICT 
      ON UPDATE CASCADE;
  END IF;
END $$;
