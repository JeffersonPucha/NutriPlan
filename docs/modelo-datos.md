# Modelo de datos de NutriPlan — Fase 2

Este documento describe la base inicial de 17 modelos. La fase actual añade
snapshots por plan y conecta la interfaz: consulta [Fase 3](fase-3-integracion.md).

PostgreSQL + Prisma **7.10.1**. Esta fase modifica datos, migraciones, seed y API;
las pantallas y el plan local del navegador continúan funcionando como antes.

## Modelos y relaciones

Se implementan los 15 modelos solicitados y dos tablas de unión para las recetas:

| Modelo | Relación y función |
| --- | --- |
| User | Nombre, email único, fechas; tiene múltiples planes, preferencias, alergias y exclusiones |
| Preference | Catálogo único de preferencias |
| Allergy | Catálogo único de alergias |
| UserPreference | Unión usuario/preferencia, con clave compuesta para evitar duplicados |
| UserAllergy | Unión usuario/alergia, con clave compuesta |
| ExcludedIngredient | Exclusión personal por nombre; referencia opcional a Product para admitir texto libre |
| Store | Supermercado con slug único y estado activo |
| Product | Nombre único, categoría, unidad base y estado activo |
| StoreProduct | Unión tienda/producto única, precio, disponibilidad y actualización |
| MealPlan | Pertenece a un usuario y tienda; presupuesto, días, personas, estado, costo y fechas |
| PlanMeal | Une plan y receta; día, tipo de comida, orden y marca de preparación |
| Recipe | Nombre, descripción, minutos, instrucciones ordenadas, porciones, imagen y costo opcionales |
| RecipeIngredient | Une receta y producto, con cantidad y unidad |
| ShoppingList | Lista de un plan; planId único garantiza una relación 1:1 |
| ShoppingItem | Producto de una lista, cantidad, unidad, precio estimado y marca de compra |
| RecipePreference | Unión receta/preferencia; sustituye el array de etiquetas anterior |
| RecipeAllergy | Unión receta/alergia; sustituye el array de alérgenos anterior |

Un plan puede crearse antes de su lista, por eso `MealPlan.shoppingList` es
opcional al nivel del cliente Prisma. Cada lista pertenece obligatoriamente a
un plan y el índice único impide crear una segunda lista para ese mismo plan.
El seed crea plan, comidas y lista en una sola transacción.

Se reutilizan las tablas User, Recipe, MealPlan, PlanMeal y ShoppingItem de la
migración inicial. Algunos campos mantienen sus columnas anteriores mediante
`@map`, por ejemplo User.nombre/displayName, Recipe.nombre/name y
MealPlan.costoEstimado/total. No hay tablas duplicadas para representar esas entidades.
La tabla anterior Preferences se sustituye por los catálogos y relaciones normalizados.

## Unidades, dinero y restricciones

- `ProductUnit`: KG, L y UNIDAD. StoreProduct.precio es el precio en USD por una
  unidad base. Los gramos del catálogo original se convierten a kilogramos al
  insertar RecipeIngredient. Por ejemplo, 180 g se guardan como 0,180 KG.
- `PlanStatus`: BORRADOR, ACTIVO, COMPLETADO y ARCHIVADO.
- `MealType`: DESAYUNO, ALMUERZO, CENA y MERIENDA. El día comienza en 1 y el
  orden comienza en 0. La combinación plan/día/tipo/orden es única.
- Los importes son Decimal y las cantidades tienen tres decimales. En las
  respuestas HTTP, los precios son cadenas con dos decimales para conservar precisión.
- Las claves foráneas impiden referencias inexistentes. Los registros de
  catálogos utilizados por recetas, planes o compras usan borrado restringido.
  Las relaciones dependientes del usuario o del plan usan Cascade. Una exclusión
  textual se conserva si se elimina el producto opcional asociado.
- La migración añade CHECK para impedir precios negativos, cantidades no
  positivas, días fuera de 1–7, personas fuera de 1–12, órdenes negativos,
  recetas sin porciones/minutos positivos y nombres vacíos de productos.
- No hay campos JSON ni arrays de identificadores para representar relaciones.
  Recipe.instrucciones es únicamente una secuencia de textos de preparación.

## Migraciones

Se conserva sin cambios `20261104164249_init`.
La nueva migración es **20261104170425_complete_nutriplan_schema**.

Se comprobó que todas las tablas anteriores estaban vacías antes de aplicarla.
La nueva migración incluye una transacción y un bloqueo preventivo: si las tablas
antiguas que se sustituyen tienen datos, se detiene y exige convertirlos antes de
continuar. No resetea la base ni borra registros existentes silenciosamente.

Se ejecutaron `prisma migrate dev --name complete_nutriplan_schema` y
`prisma generate`. El historial contiene ambas migraciones y está sincronizado.

## Seed de desarrollo

Configurado en `migrations.seed` de prisma.config.ts y ejecutado con:

```bash
npx prisma db seed
```

Usa upsert y claves únicas, dentro de una transacción. La primera ejecución
añadió **309 registros** y la segunda añadió **0**, manteniendo los mismos conteos.
Los precios son sintéticos; no se consultan supermercados ni servicios externos.

| Modelo | Registros |
| --- | ---: |
| User | 1 |
| Preference | 11 |
| Allergy | 7 |
| UserPreference | 2 |
| UserAllergy | 1 |
| ExcludedIngredient | 1 |
| Store | 4 |
| Product | 30 |
| StoreProduct | 120 |
| MealPlan | 1 |
| PlanMeal | 3 |
| Recipe | 12 |
| RecipeIngredient | 50 |
| RecipePreference | 51 |
| RecipeAllergy | 4 |
| ShoppingList | 1 |
| ShoppingItem | 10 |
| **Total** | **309** |

Las cuatro tiendas son Supermaxi, Coral Hipermercados, Gran Akí y Almacenes Tía.
Los 30 productos incluyen los 15 solicitados y los ingredientes adicionales de
las 12 recetas del prototipo. Cada producto tiene cuatro precios diferentes,
con disponibilidad y fecha de actualización. Se unifican Huevo/Huevos y
Pechuga de pollo/Pollo para evitar duplicados del catálogo de referencia.

El perfil demo utiliza `demo@nutriplan.example`, sin contraseña ni autenticación.
Su plan incluye tres almuerzos para dos personas en Supermaxi, presupuesto $50,
alergia al gluten y exclusión de brócoli. La lista agrupa los productos y calcula
su costo usando el precio de esa tienda. Repetir el seed conserva las marcas de
comprado/preparado del ejemplo. El seed actualiza los precios de referencia.

## API

Todos los endpoints nuevos son GET de lectura y ejecutan consultas reales de
PostgreSQL por petición, con Cache-Control: no-store.

| Ruta | Respuesta |
| --- | --- |
| /api/health | `{"status":"ok","database":"connected"}` tras ejecutar SELECT 1 |
| /api/stores | `{stores: [...]}` con tiendas activas |
| /api/products | `{products: [...]}` con productos activos y sus precios por tienda |
| /api/preferences | `{preferences: [...]}` |
| /api/allergies | `{allergies: [...]}` |

Health responde 503 con `database: disconnected` si falla la conexión. Los otros
endpoints responden 503 con un error genérico; no publican credenciales ni trazas.
Los endpoints existentes /api/plans y /api/ai/plan siguen devolviendo 501.
/api/recipes conserva su contrato del catálogo de referencia de la etapa anterior.

## Validación

```bash
npm run lint
npm test
npm run db
npm run build
```

`npm test` incluye las pruebas originales del plan y cinco verificaciones del
seed. `npm run db` valida el esquema y el historial, consulta PostgreSQL y comprueba
relaciones, unidades, restricciones, agrupación de compras y totales. Las pruebas
de duplicados, claves foráneas y precios negativos usan transacciones que se
revierten; no dejan registros temporales en la base.

Con Next.js iniciado, `npm run test:api` verifica los cinco endpoints por HTTP.
Puedes seleccionar otra instancia con `NUTRIPLAN_API_URL=http://127.0.0.1:3002`.
