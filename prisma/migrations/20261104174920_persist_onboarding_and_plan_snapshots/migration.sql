BEGIN;
/*
  Warnings:

  - A unique constraint covering the columns `[requestKey]` on the table `MealPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "requestKey" TEXT;

-- AlterTable
ALTER TABLE "PlanMeal" ADD COLUMN     "costoEstimado" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PlanPreference" (
    "planId" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,

    CONSTRAINT "PlanPreference_pkey" PRIMARY KEY ("planId","preferenceId")
);

-- CreateTable
CREATE TABLE "PlanAllergy" (
    "planId" TEXT NOT NULL,
    "allergyId" TEXT NOT NULL,

    CONSTRAINT "PlanAllergy_pkey" PRIMARY KEY ("planId","allergyId")
);

-- CreateTable
CREATE TABLE "PlanExcludedIngredient" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "PlanExcludedIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanPreference_preferenceId_idx" ON "PlanPreference"("preferenceId");

-- CreateIndex
CREATE INDEX "PlanAllergy_allergyId_idx" ON "PlanAllergy"("allergyId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanExcludedIngredient_planId_nombre_key" ON "PlanExcludedIngredient"("planId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_requestKey_key" ON "MealPlan"("requestKey");

-- AddForeignKey
ALTER TABLE "PlanPreference" ADD CONSTRAINT "PlanPreference_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPreference" ADD CONSTRAINT "PlanPreference_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "Preference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAllergy" ADD CONSTRAINT "PlanAllergy_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAllergy" ADD CONSTRAINT "PlanAllergy_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES "Allergy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExcludedIngredient" ADD CONSTRAINT "PlanExcludedIngredient_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserva las selecciones de los planes existentes al introducir sus snapshots.
INSERT INTO "PlanPreference" ("planId", "preferenceId")
SELECT p."id", up."preferenceId" FROM "MealPlan" p JOIN "UserPreference" up ON up."userId" = p."userId";
INSERT INTO "PlanAllergy" ("planId", "allergyId")
SELECT p."id", ua."allergyId" FROM "MealPlan" p JOIN "UserAllergy" ua ON ua."userId" = p."userId";
INSERT INTO "PlanExcludedIngredient" ("id", "planId", "nombre")
SELECT md5(p."id" || ':' || e."id"), p."id", e."nombre" FROM "MealPlan" p JOIN "ExcludedIngredient" e ON e."userId" = p."userId";
UPDATE "PlanMeal" m SET "costoEstimado" = COALESCE((
  SELECT round(sum(i."cantidad" * p."personas" / r."porciones" * sp."precio"), 2)
  FROM "MealPlan" p JOIN "Recipe" r ON r."id" = m."recipeId"
  JOIN "RecipeIngredient" i ON i."recipeId" = r."id"
  JOIN "StoreProduct" sp ON sp."productId" = i."productId" AND sp."storeId" = p."storeId"
  WHERE p."id" = m."planId"
), 0);
-- Ajusta solo diferencias de redondeo al total que ya tenía cada plan.
UPDATE "PlanMeal" m SET "costoEstimado" = m."costoEstimado" + p."total" - (SELECT sum(x."costoEstimado") FROM "PlanMeal" x WHERE x."planId" = p."id")
FROM "MealPlan" p WHERE m."id" = (SELECT x."id" FROM "PlanMeal" x WHERE x."planId" = p."id" ORDER BY x."dayIndex" DESC, x."orden" DESC LIMIT 1);
ALTER TABLE "PlanMeal" ADD CONSTRAINT "PlanMeal_cost_nonnegative" CHECK ("costoEstimado" >= 0);
COMMIT;
