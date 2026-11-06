import { databaseResponse } from "@/server/db/api";
import { recipeInclude, serializeRecipe } from "@/server/plans/serialization";
export function GET() { return databaseResponse(async (db) => ({ recipes: (await db.recipe.findMany({ orderBy: { nombre: "asc" }, include: recipeInclude })).map(serializeRecipe) })); }
