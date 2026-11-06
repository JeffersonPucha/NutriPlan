import { databaseResponse } from "@/server/db/api";

export function GET() {
  return databaseResponse(async (db) => {
    const products = await db.product.findMany({ where: { activo: true }, orderBy: { nombre: "asc" },
      include: { stores: { where: { store: { activo: true } }, orderBy: { store: { nombre: "asc" } }, select: {
        precio: true, disponibilidad: true, actualizadoEn: true, store: { select: { id: true, nombre: true, slug: true } },
      } } } });
    return { products: products.map(({ stores, ...product }) => ({ ...product,
      precios: stores.map((price) => ({ ...price, precio: price.precio.toFixed(2) })),
    })) };
  });
}
