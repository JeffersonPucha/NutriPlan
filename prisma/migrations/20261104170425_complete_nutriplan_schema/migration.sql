-- Migración revisada para la base inicial vacía de NutriPlan.
-- Si aparecieran datos en la estructura que se sustituye, se detiene sin borrarlos.
BEGIN;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Preferences")
    OR EXISTS (SELECT 1 FROM "MealPlan")
    OR EXISTS (SELECT 1 FROM "Recipe")
    OR EXISTS (SELECT 1 FROM "ShoppingItem") THEN
    RAISE EXCEPTION 'La estructura anterior contiene datos. Migre esos registros a las relaciones nuevas antes de continuar; no se ha eliminado ningún dato.';
  END IF;
END $$;
UPDATE "User" SET "displayName" = '' WHERE "displayName" IS NULL;

/*
  Warnings:

  - You are about to drop the column `preferences` on the `MealPlan` table. All the data in the column will be lost.
  - You are about to drop the column `allergens` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `ingredients` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `ShoppingItem` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ShoppingItem` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `ShoppingItem` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `ShoppingItem` table. All the data in the column will be lost.
  - You are about to drop the `Preferences` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[planId,dayIndex,tipo,orden]` on the table `PlanMeal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shoppingListId,productId]` on the table `ShoppingItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dias` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personas` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `presupuesto` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `ShoppingItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shoppingListId` to the `ShoppingItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidad` to the `ShoppingItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `displayName` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('BORRADOR', 'ACTIVO', 'COMPLETADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('DESAYUNO', 'ALMUERZO', 'CENA', 'MERIENDA');

-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('KG', 'L', 'UNIDAD');

-- DropForeignKey
ALTER TABLE "Preferences" DROP CONSTRAINT "Preferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "ShoppingItem" DROP CONSTRAINT "ShoppingItem_planId_fkey";

-- DropIndex
DROP INDEX "PlanMeal_planId_dayIndex_key";

-- DropIndex
DROP INDEX "ShoppingItem_planId_idx";

-- AlterTable
ALTER TABLE "MealPlan" DROP COLUMN "preferences",
ADD COLUMN     "dias" INTEGER NOT NULL,
ADD COLUMN     "estado" "PlanStatus" NOT NULL DEFAULT 'BORRADOR',
ADD COLUMN     "personas" INTEGER NOT NULL,
ADD COLUMN     "presupuesto" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlanMeal" ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tipo" "MealType" NOT NULL DEFAULT 'ALMUERZO';

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "allergens",
DROP COLUMN "ingredients",
DROP COLUMN "tags",
ADD COLUMN     "costoEstimado" DECIMAL(10,2),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descripcion" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imagen" TEXT,
ADD COLUMN     "porciones" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ShoppingItem" DROP COLUMN "category",
DROP COLUMN "name",
DROP COLUMN "planId",
DROP COLUMN "unit",
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "shoppingListId" TEXT NOT NULL,
ADD COLUMN     "unidad" "ProductUnit" NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "cost" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "displayName" SET NOT NULL,
ALTER COLUMN "displayName" SET DEFAULT '';

-- DropTable
DROP TABLE "Preferences";

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId","preferenceId")
);

-- CreateTable
CREATE TABLE "UserAllergy" (
    "userId" TEXT NOT NULL,
    "allergyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAllergy_pkey" PRIMARY KEY ("userId","allergyId")
);

-- CreateTable
CREATE TABLE "ExcludedIngredient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcludedIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidad" "ProductUnit" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "disponibilidad" BOOLEAN NOT NULL DEFAULT true,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "unidad" "ProductUnit" NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipePreference" (
    "recipeId" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,

    CONSTRAINT "RecipePreference_pkey" PRIMARY KEY ("recipeId","preferenceId")
);

-- CreateTable
CREATE TABLE "RecipeAllergy" (
    "recipeId" TEXT NOT NULL,
    "allergyId" TEXT NOT NULL,

    CONSTRAINT "RecipeAllergy_pkey" PRIMARY KEY ("recipeId","allergyId")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preference_nombre_key" ON "Preference"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_slug_key" ON "Preference"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Allergy_nombre_key" ON "Allergy"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Allergy_slug_key" ON "Allergy"("slug");

-- CreateIndex
CREATE INDEX "UserPreference_preferenceId_idx" ON "UserPreference"("preferenceId");

-- CreateIndex
CREATE INDEX "UserAllergy_allergyId_idx" ON "UserAllergy"("allergyId");

-- CreateIndex
CREATE INDEX "ExcludedIngredient_productId_idx" ON "ExcludedIngredient"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ExcludedIngredient_userId_nombre_key" ON "ExcludedIngredient"("userId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_nombre_key" ON "Product"("nombre");

-- CreateIndex
CREATE INDEX "Product_categoria_activo_idx" ON "Product"("categoria", "activo");

-- CreateIndex
CREATE INDEX "StoreProduct_productId_idx" ON "StoreProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_storeId_productId_key" ON "StoreProduct"("storeId", "productId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_productId_idx" ON "RecipeIngredient"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_productId_key" ON "RecipeIngredient"("recipeId", "productId");

-- CreateIndex
CREATE INDEX "RecipePreference_preferenceId_idx" ON "RecipePreference"("preferenceId");

-- CreateIndex
CREATE INDEX "RecipeAllergy_allergyId_idx" ON "RecipeAllergy"("allergyId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingList_planId_key" ON "ShoppingList"("planId");

-- CreateIndex
CREATE INDEX "MealPlan_storeId_idx" ON "MealPlan"("storeId");

-- CreateIndex
CREATE INDEX "PlanMeal_recipeId_idx" ON "PlanMeal"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanMeal_planId_dayIndex_tipo_orden_key" ON "PlanMeal"("planId", "dayIndex", "tipo", "orden");

-- CreateIndex
CREATE INDEX "ShoppingItem_productId_idx" ON "ShoppingItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingItem_shoppingListId_productId_key" ON "ShoppingItem"("shoppingListId", "productId");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "Preference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAllergy" ADD CONSTRAINT "UserAllergy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAllergy" ADD CONSTRAINT "UserAllergy_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES "Allergy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcludedIngredient" ADD CONSTRAINT "ExcludedIngredient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcludedIngredient" ADD CONSTRAINT "ExcludedIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipePreference" ADD CONSTRAINT "RecipePreference_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipePreference" ADD CONSTRAINT "RecipePreference_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "Preference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeAllergy" ADD CONSTRAINT "RecipeAllergy_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeAllergy" ADD CONSTRAINT "RecipeAllergy_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES "Allergy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reglas que también se cumplen fuera de la aplicación.
ALTER TABLE "Product" ADD CONSTRAINT "Product_nombre_not_blank" CHECK (length(trim("nombre")) > 0);
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_precio_nonnegative" CHECK ("precio" >= 0);
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_limits" CHECK ("presupuesto" > 0 AND "total" >= 0 AND "dias" BETWEEN 1 AND 7 AND "personas" BETWEEN 1 AND 12);
ALTER TABLE "PlanMeal" ADD CONSTRAINT "PlanMeal_order_limits" CHECK ("dayIndex" BETWEEN 1 AND 7 AND "orden" >= 0);
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_positive_values" CHECK ("minutes" > 0 AND "porciones" > 0 AND ("costoEstimado" IS NULL OR "costoEstimado" >= 0));
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_positive_quantity" CHECK ("cantidad" > 0);
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_positive_values" CHECK ("quantity" > 0 AND "cost" >= 0);
COMMIT;
