# Fase 3: interfaz conectada a PostgreSQL

## Archivos principales

- `src/server/auth/current-user.ts`: único proveedor del usuario de desarrollo.
- `src/server/plans/repository.ts`: validación de catálogos, transacción y consultas completas.
- `src/server/plans/calculation.ts`: selección de recetas compatibles y cálculo Decimal con precios StoreProduct.
- `src/server/plans/serialization.ts`: DTO de planes, comidas, recetas y compras.
- `src/server/http.ts`: JSON, códigos HTTP y errores públicos seguros.
- `src/lib/domain/validation.ts`: validación de entrada y normalización compartida.
- `src/lib/api/client.ts`: fetch con errores amigables y timeout.
- `src/features/plan/plan-store.ts`: estado temporal alimentado por la API.
- `src/features/plan/use-plan-creation.ts`: POST, estados de carga y reintentos sin duplicados.
- Los pasos del onboarding, las cinco pantallas y sus diálogos: conservan los estilos y consumen datos reales.
- `prisma/schema.prisma`, nueva migración y seed: snapshots relacionales para planes nuevos y anteriores.
- `scripts/check-api.ts`, `tests/domain.test.ts` y `tests/e2e/nutriplan.spec.ts`: comprobaciones de servidor y navegador.

Se eliminaron `src/lib/storage/persistence.ts` y el generador local
`src/lib/domain/planner.ts`. Los JSON y opciones del seed se movieron de
`src/lib/data/` a `prisma/data/` para no formar parte del código de las pantallas.
Se conservan la paleta, Lucide y la distribución visual. El único ajuste del
CSS global evita que el calendario de siete días ensanche la pantalla móvil.

## Endpoints creados

- GET `/api/plans/:id`
- GET `/api/plans/:id/shopping-list`
- PATCH `/api/shopping-items/:id`
- PATCH `/api/plan-meals/:id`
- GET y PATCH `/api/profile`

## Endpoints modificados

- GET `/api/plans`: recupera el último plan del DEMO desde PostgreSQL.
- POST `/api/plans`: crea plan, comidas, restricciones y lista, y devuelve el plan completo.
- GET `/api/recipes`: dejó de devolver el array de referencia y consulta Recipe/RecipeIngredient.

Health, stores, products, preferences y allergies siguen consultando PostgreSQL.
OpenAI continúa sin implementar; no se añadió publicidad ni autenticación externa.

## Guardado y recuperación

El onboarding envía identificadores reales de tienda, preferencias y alergias,
presupuesto, días, personas y exclusiones. El servidor comprueba que existan,
selecciona recetas de PostgreSQL y excluye las que tienen alérgenos, ingredientes
no deseados, productos inactivos o precios no disponibles en la tienda.

La creación utiliza una transacción Serializable. Las preferencias del usuario y
los snapshots del plan se guardan junto con sus comidas y compras. Si falla una
validación o no alcanza el presupuesto, no quedan registros parciales.

El dashboard se carga desde GET `/api/plans`; la consulta por identificador
utiliza GET `/api/plans/:id`. Las relaciones se cargan mediante includes de Prisma,
sin consultas dentro de un bucle por comida o ingrediente. Las cantidades y precios
que muestra la interfaz proceden de los registros guardados, no se recalculan
con un catálogo estático en el navegador.

Compras utiliza la ShoppingList incluida en la respuesta del plan. También existe
su endpoint específico. PATCH confirma el cambio en PostgreSQL antes de actualizar
la casilla; si falla, no se presenta como guardado y se puede reintentar.
El marcado de comidas preparadas y la edición del nombre siguen el mismo patrón.

## localStorage

Solo permanece `nutriplan.theme`, para la apariencia visual. Ya no se lee ni se
escribe `nutriplan.react.v1`, `nutriplan.userState.v2`, `nutriplan.currentPlan.v2`
ni el indicador local de onboarding. Los datos antiguos que pudieran permanecer
en el navegador no se importan ni se utilizan para decidir qué plan mostrar.
Borrar todo localStorage no borra la planificación de PostgreSQL.

## Usuario de desarrollo

El usuario por defecto es `demo_nutriplan_user`, creado por el seed con el email
`demo@nutriplan.example`. `NUTRIPLAN_DEMO_USER_ID` permite elegir otro registro
existente desde el servidor. Ningún componente React contiene esa identidad y
ningún endpoint acepta un userId enviado por el cliente. Antes del login real,
todas las visitas utilizan ese perfil compartido; esta es una decisión explícita
de la fase de desarrollo, no una sesión de autenticación.

## Prueba de persistencia

1. Abrir `/onboarding` y seleccionar Coral Hipermercados.
2. Indicar $50, 7 días y 2 personas.
3. Elegir Alto en proteína y Saludable.
4. Desactivar «No tengo alergias», marcar Lactosa y excluir Brócoli.
5. Crear el plan. El POST debe responder 201 y mostrar el dashboard.
6. Pulsar F5; los datos se recuperan desde PostgreSQL.
7. Ir a Compras, marcar un producto y volver a recargar.
8. Verificar el mismo registro de ShoppingItem con checked=true.
9. En Prisma Studio o DBeaver, revisar MealPlan, PlanMeal, PlanPreference,
   PlanAllergy, PlanExcludedIngredient, ShoppingList y ShoppingItem.

La prueba automática del navegador hace ese recorrido y consulta las tablas
mediante SQL para confirmar que los datos existen fuera del navegador.

## Inspección de la base

```bash
npx prisma studio
```

Los nombres de algunas columnas SQL se conservan mediante @map: por ejemplo,
ShoppingItem.comprado corresponde a `checked` y MealPlan.costoEstimado a `total`.
La nueva migración mantiene los registros y ambas migraciones previas.

## Comandos de validación

```bash
npm run lint
npm test
npm run db:validate
npm run build
npm run test:api
npm run test:e2e
```

## Resultado de la validación

Validado el 4 de noviembre de 2026:

- `npm run lint`: aprobado.
- `npm test`: 14 pruebas aprobadas.
- `npm run db:validate`: esquema válido.
- `npm run db`: PostgreSQL conectado, tres migraciones aplicadas y relaciones verificadas.
- `npm run build`: compilación de producción aprobada.
- `npm run test:api`: aprobado contra el servidor local y PostgreSQL real.
- `npm run test:e2e`: 10 pruebas aprobadas, cinco en móvil y cinco en escritorio.

El recorrido del navegador verificó la eliminación de localStorage, F5, compras
y comidas preparadas persistentes, edición de perfil, tema, errores recuperables
de catálogo y guardado, y el ajuste de un presupuesto insuficiente. Los datos
del onboarding y el producto comprado se comprobaron también mediante SQL.

La última comprobación de API dejó el plan
`cmw2fw9ho007hrkwoblul4rrv`, con Coral Hipermercados, $50, siete días, dos personas,
Alto en proteína, Saludable, alergia a Lactosa y exclusión de Brócoli. Tiene siete
comidas y 19 productos; el primer producto está marcado como comprado. Se puede
inspeccionar en `/api/plans/cmw2fw9ho007hrkwoblul4rrv` y en Prisma Studio.

La migración nueva es
`20261104174920_persist_onboarding_and_plan_snapshots`. Agrega PlanPreference,
PlanAllergy y PlanExcludedIngredient para conservar las restricciones históricas,
una clave opcional contra envíos duplicados y el costo persistente por comida.
Los datos existentes se conservaron y el esquema queda con 20 modelos.
