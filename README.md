# NutriPlan

Aplicación Next.js App Router + TypeScript + Tailwind CSS, integrada con
PostgreSQL y Prisma 7.10.1. Mantiene la interfaz Mobile First, la paleta pastel,
Lucide y las cinco pantallas. El HTML de `referencias/` es únicamente una referencia.

## Ejecutar

Con `DATABASE_URL` configurada y las migraciones aplicadas:

```bash
npm ci
npm run dev
```

El usuario de desarrollo debe existir: el seed crea `demo_nutriplan_user`, con
email `demo@nutriplan.example`. La selección del usuario está centralizada en
`src/server/auth/current-user.ts` y se puede configurar desde el servidor con
`NUTRIPLAN_DEMO_USER_ID`. Todas las pruebas utilizan ese perfil compartido mientras
no exista autenticación. No se implementaron login externo, OpenAI ni publicidad.

```bash
npm run db:generate
npm run db:seed
npm run db
```

El seed es para desarrollo. No se necesita repetirlo para crear planes desde
la interfaz; esos planes se guardan mediante `POST /api/plans`.

## Integración de las pantallas

El onboarding carga tiendas, preferencias, alergias y productos desde la API.
Los chips y tarjetas no contienen copias de esos catálogos. Al finalizar, valida
la entrada y hace POST al servidor; solo redirige al dashboard después de recibir
el plan persistido. Las sugerencias de ingredientes también salen de PostgreSQL.

El backend valida los identificadores, consulta los productos disponibles y sus
precios de `StoreProduct`, selecciona recetas compatibles y adapta sus porciones.
Guarda el plan, comidas, restricciones y compras en una sola transacción.
Una planificación conserva sus propias preferencias, alergias y exclusiones,
para que los cambios del perfil no alteren planes anteriores.

Inicio, Semana, Compras, Recetas y Perfil muestran datos del servidor. Las marcas
de comprado y preparado, y el nombre del perfil, se guardan mediante PATCH.
Una compra no aparece como guardada hasta que el servidor la confirma. F5 vuelve
a consultar la API. Si una petición falla, aparece un aviso y se puede reintentar.

El estado React es temporal. **localStorage guarda únicamente el tema visual**
con la clave `nutriplan.theme`; no guarda planes, usuarios, preferencias,
alergias ni compras. Las antiguas claves del navegador ya no se leen ni se importan.

## Carpetas principales

```text
src/app/                      Páginas, layouts y Route Handlers
src/components/               UI, navegación y PWA
src/features/onboarding/      Siete pasos conectados a catálogos reales
src/features/plan/            Dashboard, semana, peticiones y estado React
src/features/shopping/        Compras persistentes
src/features/recipes/         Recetas e ingredientes recibidos del servidor
src/features/profile/         Perfil persistente
src/lib/api/                  Cliente HTTP y errores
src/lib/domain/               Tipos, normalización y validación compartida
src/server/auth/              Selección centralizada del usuario DEMO
src/server/plans/             Cálculo, transacciones y serialización
src/server/db/                Cliente Prisma y respuestas de catálogos
prisma/                       Esquema, migraciones, seed y datos exclusivos del seed
scripts/                      Comprobaciones reales de DB y API
public/                       Fuente, iconos y PWA
```

Las páginas siguen siendo pequeñas. Los datos de desarrollo de recetas y
opciones se trasladaron a `prisma/data/`: no se importan desde el frontend.

## API

| Método y ruta | Función |
| --- | --- |
| GET /api/health | Comprueba PostgreSQL con SELECT 1 |
| GET /api/stores | Tiendas activas |
| GET /api/products | Productos y precios reales por tienda |
| GET /api/preferences | Preferencias |
| GET /api/allergies | Alergias |
| GET /api/recipes | Recetas, ingredientes, preferencias y alérgenos reales |
| GET /api/profile | Perfil y selección actual del DEMO |
| PATCH /api/profile | Guarda `{name}` |
| GET /api/plans | Último plan no archivado del DEMO, o null |
| POST /api/plans | Crea una planificación completa |
| GET /api/plans/:id | Plan del DEMO con comidas y compras |
| GET /api/plans/:id/shopping-list | Lista con productos, cantidades, tienda y costos |
| PATCH /api/shopping-items/:id | Guarda `{purchased: true/false}` |
| PATCH /api/plan-meals/:id | Guarda `{prepared: true/false}` |

Las peticiones utilizan Cache-Control: no-store. Los identificadores de usuario
nunca se aceptan desde el navegador. Los registros de otro usuario devuelven 404.
Las respuestas no incluyen credenciales ni stack traces. Las claves privadas
siguen limitadas a módulos del servidor.

POST acepta `storeId`, `budget`, `days`, `people`, `preferenceIds`, `allergyIds` y
`excludedIngredients`. También admite `strategy` (standard, economical,
reduce-days) y una `requestKey` UUID v4 para reintentar una solicitud sin duplicar
el plan. Responde 201 al crear y 200 al recuperar una petición ya creada.

Si el presupuesto no alcanza, responde 409 con el costo estimado; no guarda un
plan parcial ni modifica las preferencias. Los botones existentes permiten
optimizar, reducir días o editar el presupuesto. No se descartan restricciones
para forzar una planificación.

## Datos y migración de esta fase

La migración `20261104174920_persist_onboarding_and_plan_snapshots` añade
PlanPreference, PlanAllergy y PlanExcludedIngredient, la clave de repetición y
el costo de cada comida. Conserva los datos previos y copia a los planes ya
existentes las restricciones que tenían al migrar. Las dos migraciones anteriores
se mantienen intactas. El esquema tiene ahora 20 modelos relacionados.

Las cantidades se guardan en KG, L o UNIDAD. Los cálculos del servidor utilizan
Decimal y los precios del supermercado elegido; no hay factores de tienda ni
precios de recetas escritos en React. Las compras y los costos de las comidas
quedan guardados como estimaciones del momento en que se creó el plan.

El [informe de la fase 3](docs/fase-3-integracion.md) explica las rutas, la
persistencia y la prueba completa. El [documento de la fase 2](docs/modelo-datos.md)
conserva el detalle del modelo y seed originales.

## Comprobar

```bash
npm run lint
npm test
npm run db:validate
npm run build
```

Con Next.js iniciado:

```bash
npm run test:api
```

La prueba de API crea un plan de verificación del DEMO, comprueba sus registros
reales en PostgreSQL, marca compras y comidas, prueba validaciones y verifica que
un plan conserva sus restricciones después de cambiar las selecciones del usuario.
Puedes usar otra instancia con `NUTRIPLAN_API_URL=http://127.0.0.1:3002`.

Para el recorrido de navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

También puedes seleccionar un Chromium instalado con `PLAYWRIGHT_BROWSER_PATH`.
`PLAYWRIGHT_PORT` permite elegir otro puerto. Las pruebas cubren móvil y escritorio,
el onboarding Coral/$50/7 días/2 personas, F5, compras persistentes, recetas,
perfil, tema, errores de catálogo, compras fallidas y ajuste de presupuesto.
La comprobación principal consulta además PostgreSQL directamente.

## PWA

Se conservan manifiesto, iconos, instalación y service worker de producción.
Solo se cachean recursos públicos. Las API no se cachean y la pantalla sin
conexión explica que hace falta conectarse para recuperar la planificación.
