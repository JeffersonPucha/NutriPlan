# Auditoría y refinamiento UX/UI de NutriPlan

Fecha: 4 de noviembre de 2026.

Se aplicaron las skills instaladas `emil-design-eng` y `animation-performance`
de emilkowalski/skills, disponibles en `.agents/skills/`.

## Alcance y método

Antes de editar se recorrieron Inicio, Semana, Compras, Recetas, Perfil, el
formulario de filtros y los siete pasos originales del onboarding en un navegador
real, a 375 × 812 y 1440 × 1000. Se capturaron las pantallas completas y se
revisaron sus componentes, estilos, foco, áreas táctiles y movimiento. La tabla de
hallazgos y correcciones se presentó en el chat antes de modificar componentes.

Se conservaron los colores pastel, fondos cálidos, formas redondeadas, tipografía,
Lucide y las cinco secciones principales. Los cambios se limitan a presentación,
navegación e interacción de la interfaz. No se modificaron modelos, migraciones,
seed, Route Handlers, cálculos, repositorios, contratos de API ni el estado de
persistencia. No se ejecutaron migraciones ni seed.

## Hallazgos y correcciones

| Prioridad | Clasificación | Pantalla | Antes | Después | Motivo |
| --- | --- | --- | --- | --- | --- |
| Alta | interacción | Onboarding | Días y personas compartían un paso. | Ocho pasos: días y personas independientes. | Una decisión principal por pantalla. |
| Alta | redundancia | Onboarding | Tarjetas de 3/5/7 días más un selector de 1–7. | Una única selección de 1–7 días. | Evitar dos controles para el mismo dato; conservar todos los valores. |
| Alta | interacción | Resumen | Un botón para presupuesto/días/personas o alergias/exclusiones abría solo el primer paso de cada grupo. | Cada decisión tiene su fila y botón de edición. | Acceder directamente al dato que se quiere cambiar. |
| Alta | navegación | Inicio/Semana | Varios accesos equivalentes a filtros en la misma pantalla. | Un acceso global identificable como Filtros en móvil; acceso contextual en Perfil. | Evitar acciones duplicadas sin perder la edición. |
| Alta | jerarquía | Inicio | Mensajes motivacionales, tarjetas secundarias y métricas precedían las comidas. | Banner breve, presupuesto consolidado, preferencias y comidas. | Acercar el contenido operativo. |
| Alta | redundancia | Presupuesto | Costo y saldo repetidos en dos métricas, una barra y un badge. | Costo/límite, barra y saldo una sola vez. | Leer el presupuesto sin comparar cifras duplicadas. |
| Alta | navegación | Semana | Fecha oculta en móvil; día activo desacoplado de anclas y desplazamiento; Inicio y Semana reutilizaban el ancla del día 1. | Fecha visible, selector persistente, seguimiento de las comidas visibles y anclas únicas. | Entender qué día se está consultando y llegar a la comida correcta desde Inicio. |
| Alta | accesibilidad | Diálogos | El foco podía perderse al desmontar un diálogo. | Restitución explícita al control que lo abrió, sin desplazar la página. | Continuar con teclado desde el punto de origen. |
| Alta | accesibilidad | Compras | La fila comprada completa tenía opacidad 0,65. | Check y nombre tachado, con cantidad y precio sin atenuación global. | Mantener legibles los datos al comprar. |
| Alta | accesibilidad | General | Icon buttons de 42 px, contador de 32 px, chips de 42 px y switch de 27 px. | Áreas táctiles de al menos 44 px; la parte visual del switch sigue siendo compacta. | Facilitar uso táctil y foco. |
| Alta | accesibilidad | General | Texto secundario con contraste 4,40 sobre fondo cálido y 4,21 sobre fondo tenue. | Gris secundario ajustado a #667168: 4,87 y 4,66 respectivamente. | Mejorar lectura sin cambiar la identidad cromática. |
| Media | accesibilidad | Formularios | Bordes de radio/checkbox casi indistinguibles sobre blanco. | Token específico para contornos funcionales; bordes decorativos siguen suaves. | Distinguir el control sin añadir bordes fuertes a todas las tarjetas. |
| Media | jerarquía | Filtros | Formulario largo con todas las secciones y tarjetas anidadas abiertas. | Desplegables nativos con resumen actual y presupuesto abierto inicialmente. | Encontrar una preferencia y editarla con menos desplazamiento. |
| Media | redundancia | Onboarding | Las tiendas repetían la misma explicación; presupuesto tenía campo, slider, presets y dos notas. | Explicación única; importe editable, presets y una indicación de límites. | Reducir repetición conservando entrada libre y selección rápida. |
| Media | interacción | Exclusiones | Sugerencias ya elegidas seguían visibles; Agregar aceptaba un campo vacío; un botón de vaciado parecía una opción para continuar. | Sugerencias sin duplicados, Agregar desactivado si está vacío y Quitar todos solo cuando hay exclusiones. | Clarificar el resultado de cada acción. |
| Media | jerarquía | Compras | Tarjeta motivacional, contador, porcentaje, barra y conteos de categorías competían con productos. | Contador y barra compactos; producto, cantidad y precio destacados. | Priorizar la tarea de compra. |
| Media | redundancia | Recetas | Etiquetas repetidas en tarjetas y detalle; flecha diagonal sugería abrir un enlace externo. | Tarjetas con imagen, nombre, tiempo e ingredientes; etiquetas en el detalle y flecha de avance. | Mostrar primero lo necesario para elegir una receta. La búsqueda por etiquetas se conserva. |
| Media | interacción | Recetas | Cambiar la búsqueda no anunciaba el número de coincidencias. | Estado de resultados accesible. | Comunicar el efecto de la búsqueda. |
| Media | jerarquía | Perfil/Inicio/Recetas | Contenedores anidados, tarjeta motivacional lateral y placeholders de desarrollo visibles. | Resúmenes planos y acceso sencillo a Crear otro plan; placeholders fuera del recorrido principal. | Reducir contenedores que no aportaban al flujo. AdSlot permanece disponible como componente. |
| Media | interacción | Perfil/diálogos | Guardar nombre sin cambios estaba habilitado; cerrar durante una generación no indicaba su estado. | Guardar solo ante cambios y feedback de guardado; cierre desactivado mientras se genera. | Evitar acciones sin efecto y controles que parecen responder pero no lo hacen. |
| Media | responsive | General | Inputs de 13–14 px, iconos comprimibles y riesgo de textos largos. | Inputs de 16 px en móvil, iconos sin contracción y ajuste de texto. | Evitar zoom automático en iOS y desbordamientos. |
| Media | animación | Recetas/progreso | Hover con desplazamiento incluso en touch y transición de anchura del progreso. | Hover solo con ratón, sin desplazamiento de tarjetas; progreso inmediato. | Evitar hover accidental y animación de layout. |
| Media | animación | Controles/navegación | Duraciones dispersas y desplazamiento suave global. | Feedback de pulsación de 160 ms con curva compartida; navegación por días y pasos inmediata. | Respuesta coherente en acciones frecuentes. |
| Media | accesibilidad | Onboarding/movimiento | El foco permanecía en Continuar al cambiar el contenido; reducción de movimiento eliminaba todo feedback. | Foco en el título de cada paso; sin transformaciones con movimiento reducido, conservando feedback suave de color. | Orientar al usuario de teclado y respetar su preferencia. |
| Baja | jerarquía | General | Plurales como «1 personas» y tamaños de iconos de acciones y metadatos variables. | Singular/plural correcto y tamaños coherentes según función. | Mejorar claridad y consistencia. |

## Comportamientos conservados

- Selección de tienda, presupuesto libre y presets, días 1–7 y personas 1–12.
- Preferencias múltiples, alergias y opción No tengo alergias, exclusiones libres.
- Resumen editable, generación, recuperación y ajustes por presupuesto insuficiente.
- Calendario, acceso a recetas, marcado de comidas y compras.
- Búsqueda por nombre, ingrediente o preferencia; ingredientes, pasos y alérgenos.
- Edición del nombre, tema claro/oscuro, instalación PWA y creación de otro plan.
- Navegación inferior en móvil y lateral en escritorio; solo una visible por ancho.

Los datos que aparecen en varias pantallas porque cumplen tareas diferentes
(presupuesto en Inicio, total en Compras, revisión en Perfil) se conservaron.
No se agregaron animaciones decorativas ni una librería de animación.

## Archivos modificados

| Área | Archivos |
| --- | --- |
| Estilos y layout raíz | `src/app/globals.css`, `src/app/layout.tsx` |
| Navegación y mensajes | `src/components/layout/app-shell.tsx`, `navigation.tsx`, `app-provider.tsx` |
| Componentes comunes | `src/components/ui/modal.tsx`, `page-heading.tsx` |
| Onboarding | `src/features/onboarding/onboarding-flow.tsx`, `market-step.tsx`, `budget-step.tsx`, `scope-step.tsx`, `allergies-step.tsx`, `avoid-step.tsx`, `summary-step.tsx` |
| Planificación | `src/features/plan/home-screen.tsx`, `budget-card.tsx`, `week-screen.tsx`, `meal-card.tsx`, `preferences-dialog.tsx`, `generation-dialog.tsx` |
| Compras | `src/features/shopping/shopping-screen.tsx` |
| Recetas | `src/features/recipes/recipes-screen.tsx`, `recipe-dialog.tsx` |
| Perfil | `src/features/profile/profile-screen.tsx` |
| Pruebas | `tests/e2e/nutriplan.spec.ts` adaptado a ocho pasos; `tests/e2e/ui-audit.spec.ts` nuevo |
| Informe | `docs/auditoria-ux-ui.md` |

## Verificación

```bash
npm run lint
npm test
npm run build
```

La suite adicional de interfaz puede ejecutarse con:

```bash
npm run test:e2e -- tests/e2e/ui-audit.spec.ts
```

Si Playwright no tiene un navegador descargado, se puede señalar uno instalado:

```bash
PLAYWRIGHT_BROWSER_PATH=/opt/brave-origin-bin/brave npm run test:e2e -- tests/e2e/ui-audit.spec.ts
```

La suite tiene siete recorridos por dispositivo, catorce en total. Usa GET reales
y bloquea cualquier escritura no interceptada. El guardado pendiente y los errores
se comprueban con respuestas interceptadas en el navegador. Se revisan navegación,
ocho pasos, payload de onboarding, resumen, anclas, compras, búsqueda, foco de
modal, cancelación de filtros, textos largos, contraste en ambos temas y movimiento
reducido. Se incluyen anchos de 320, 375, 768, 1024 y 1440 px.

La suite anterior que crea planes y marca productos en PostgreSQL se adaptó al
nuevo onboarding, pero no se ejecutó durante esta auditoría para no escribir en
la base de datos. No se afirma una certificación completa de accesibilidad ni una
medición de frames en hardware móvil físico: la comprobación se hizo con Chromium,
viewports y preferencias de movimiento emulados.

## Resultados finales

- `npm run lint`: aprobado, sin errores.
- `npm test`: 14 pruebas aprobadas, ninguna fallida.
- `npm run build`: compilación de producción y TypeScript aprobados.
- Suite de interfaz: 14 pruebas aprobadas, siete en móvil y siete en escritorio.
- Tras eliminar las anclas duplicadas se repitieron las dos comprobaciones de
  navegación de Semana, con enlaces de cliente desde Inicio: ambas aprobadas.
- La comparación con el estado anterior confirmó que `src/server/` y
  `src/features/plan/plan-store.ts` no cambiaron.
- Las pruebas de interfaz bloquearon o interceptaron POST/PATCH: no escribieron
  planes, preferencias, perfil ni compras en PostgreSQL.
