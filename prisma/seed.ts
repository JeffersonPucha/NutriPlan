import { createDatabaseClient } from "../scripts/database-client";
import { seedDevelopment } from "./seed-runner";

const prisma = createDatabaseClient();
seedDevelopment(prisma).then(({ added, totals }) => {
  console.log("Seed de desarrollo completado. Precios sintéticos de referencia.");
  console.table(Object.entries(totals).map(([model, total]) => ({ modelo: model, añadidos: added[model], total })));
  console.log("Registros añadidos:", Object.values(added).reduce((sum, count) => sum + count, 0));
}).catch((err) => {
  console.error("No se pudo completar el seed; la transacción se revirtió. Revisa la conexión y las migraciones.", err);
  console.error("Error exacto:", err.code, err.message, err.meta);
  process.exit(1);
}).finally(() => prisma.$disconnect());
