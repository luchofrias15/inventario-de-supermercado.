# Inventario de Tienda · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_TIENDA.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: dos caminos. Si ya tienes el proyecto Next.js desplegado en Vercel, con Supabase conectado y login funcionando, empieza en **P00**. Si partes de cero, empieza en **P-INIT**, que levanta la infraestructura, y luego sigue con P00.

---

## Antes de empezar: seguridad (importante)

El plan funcional traía pegado un bloque `.env` con credenciales reales de Supabase (la `SERVICE_ROLE_KEY`, la `SECRET_KEY`, el `JWT_SECRET` y la contraseña de la base). Antes de nada:

1. En Supabase, Settings, API: rotar la `anon key` y la `service_role key` ("Roll").
2. En Supabase, Settings, Database: restablecer la contraseña de la base de datos.
3. Actualizar `.env.local` y las variables de Vercel con los valores nuevos.
4. Confirmar que `.env.local` está en `.gitignore`.
5. No volver a pegar un `.env` en la entrega.

No continuar hasta terminar estos pasos. La `SERVICE_ROLE_KEY` expuesta da acceso total a la base de datos.

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_TIENDA.md` y `PROMPTS_TIENDA.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt: revisar los cambios y aceptarlos (**Keep**); hacer la verificación indicada; hacer commit con el mensaje sugerido y `git push`. Vercel desplegará; si falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final.

| Fase | Prompts |
|---|---|
| Fundación (solo si partes de cero) | P-INIT |
| 0 · Conciliación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz | P06, P07, P08 |
| 7 · Opcionales | P09 |

---

## P-INIT · Fundación: crear el proyecto, Supabase, login y despliegue (solo si partes de cero)

**Fase:** fundación · **Crea:** el proyecto Next.js completo con login y conexión a Supabase · **Omitir si:** ya tienes el proyecto desplegado en Vercel con Supabase y login (en ese caso empieza en P00).

> Este prompt levanta la infraestructura que los demás prompts dan por hecha. Hay pasos que Copilot no puede hacer por ti (crear la cuenta de Supabase, la de Vercel, copiar las claves): el prompt te los indica y espera. Al terminar, tendrás el mismo punto de partida que asume P00.

Antes de pegar el prompt, ten listo: Node.js 20 o superior, una cuenta de GitHub, una cuenta en Supabase (supabase.com) y otra en Vercel (vercel.com), las dos gratuitas.

````text
Actúa como ingeniero de software senior trabajando en modo agente. Vamos a crear desde cero el proyecto "Inventario de Tienda" sobre el stack del curso: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres, con despliegue en Vercel y un login. El plan técnico está en doc/PLAN_TIENDA.md; léelo (secciones 1, 11 y 16) para el stack y las convenciones. NO implementes todavía las funcionalidades del dominio (productos, lotes, ventas): este prompt solo deja la base lista.

Trabaja por pasos y, cuando un paso dependa de algo que yo deba hacer a mano (crear una cuenta, copiar una clave), detente, dime exactamente qué hacer y espera mi confirmación.

PASO 1. Crea el proyecto Next.js con TypeScript, Tailwind y App Router en la carpeta actual (si ya hay package.json, detente y avísame; quizá no partes de cero y debes usar P00). Usa create-next-app con TypeScript, ESLint, Tailwind, carpeta app y alias "@/*". Instala dependencias.

PASO 2. Agrega pg y @types/pg, zod y vitest. Crea vitest.config.ts (environment node, include ['tests/**/*.test.ts'], alias "@"). Agrega a package.json: "test": "vitest run", "test:ver": "vitest", "type-check": "tsc --noEmit".

PASO 3. Verifica que compila: npm run build. Si falla, corrige lo mínimo y reintenta.

PASO 4. Detente y dame estas instrucciones para la base de datos, y espera mi confirmación:
- Entrar a supabase.com, crear un proyecto nuevo (región más cercana; guardar la contraseña de la base).
- Conectarlo a Vercel o copiar desde Supabase (botón "Connect") la cadena "Transaction pooler" (puerto 6543), reemplazando [YOUR-PASSWORD].
- Crear .env.local en la raíz con esa cadena como DATABASE_URL=... (y, si el login las necesita, NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY de Settings → API).
Recuérdame que .env.local NUNCA se sube a git y que, si ya existía un .env con claves viejas, deben haberse rotado (ver la advertencia de seguridad al inicio del archivo de prompts).

PASO 5. Cuando confirme, verifica que .gitignore excluye .env*. Crea lib/db/conexion.ts con un Pool de pg que lea DATABASE_URL (ssl rejectUnauthorized:false; max 3; reutilizar el pool en desarrollo con globalThis; parsers para DATE/TIMESTAMP como texto y BIGINT como número), según la sección 11.7 del plan. Escribe un script temporal con un SELECT 1 y pídeme ejecutarlo; cuando confirme que conecta, elimínalo.

PASO 6. Login: implementa un login mínimo como puerta (no roles): una página /login con una contraseña de acceso guardada como variable de entorno (CLAVE_ACCESO) que fije una cookie de sesión firmada (secreto COOKIE_SECRET); y un archivo de protección de rutas (proxy.ts en Next 16, o middleware.ts antes) que proteja todo salvo /login y los recursos públicos. Crea lib/auth/sesion.ts con obtenerSesion() y exigirSesion(). Dime qué variables agregar a .env.local (CLAVE_ACCESO, COOKIE_SECRET) y luego a Vercel.

PASO 7. Deja app/page.tsx protegida: con sesión muestra "Inventario de Tienda" y cerrar sesión; sin sesión redirige a /login. Las pantallas reales son de P06 en adelante.

PASO 8. Verifica: npm run build sin errores; npm run dev y comprobar que sin sesión / redirige a /login y que con la clave entra. Pídeme que lo pruebe y espera.

PASO 9. Detente y dame las instrucciones para desplegar, y espera mi confirmación:
- Subir a un repositorio de GitHub nuevo (git init, commit, push).
- En vercel.com, "Add New Project", importar el repositorio.
- Agregar en Vercel las variables de entorno (DATABASE_URL, CLAVE_ACCESO, COOKIE_SECRET y las de Supabase si se usan) para Production, Preview y Development.
- Desplegar y abrir la URL; comprobar que pide la clave y entra.
Si el despliegue falla, usa el prompt de "Despliegue fallido en Vercel" del final.

AL TERMINAR:
- Crea doc/ (si no existe) y copia allí los dos documentos del proyecto.
- Confírmame: proyecto Next que compila, conexión a Postgres probada, login funcionando en local y en Vercel.
- Dime que el siguiente paso es ejecutar P00 (conciliación) en una conversación nueva.

RESTRICCIONES: no implementes productos, lotes ni ventas todavía (eso es de P01 en adelante). No subas .env.local a git. No inventes claves: cuando una variable deba tener un valor real, pídemela o indícame cómo generarla.
````

**Verificación del estudiante:** al terminar debes tener la app en una URL de Vercel que pide la clave y, al entrar, muestra la página de inicio. Guarda en un lugar seguro la contraseña de la base, la clave de acceso y el secreto de cookie.

**Commit sugerido:** `chore: fundación del proyecto (Next, Supabase, login y despliegue)`

> A partir de aquí el punto de partida es el mismo, hayas hecho P-INIT o no: proyecto Next desplegado en Vercel, con Supabase conectado y login. Continúa con P00.

---

## P00 · Conciliación: qué hay, qué falta, qué se crea

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `doc/DICTAMEN.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio.

Contexto: el proyecto "Inventario de Tienda" (inventario de una tienda de barrio: productos, lotes con vencimiento, entradas y ventas, alertas de reorden) se construye sobre el stack del curso (Next.js + TypeScript + Tailwind + Supabase + Vercel). Este prompt NO implementa funcionalidades: audita lo que exista y produce un dictamen. El plan técnico está en doc/PLAN_TIENDA.md.

Lee completo doc/PLAN_TIENDA.md, en especial las secciones 0, 1, 2, 3, 7, 8 y 18.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con una radiografía fiel. No supongas: revisa el repositorio. Secciones:
1. ¿Hay un proyecto Next.js con TypeScript? Versión de next, react, typescript, tailwindcss; si no hay package.json o no es Next, dilo (habría que correr P-INIT).
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/, scripts/ hasta 3 niveles; indica si usa src/.
4. Dependencias relevantes presentes o ausentes: pg, zod, @supabase/supabase-js, vitest. Marca cuáles FALTAN.
5. Autenticación: ¿hay login? Si lo hay, archivos, mecanismo, función de sesión, ruta de login, a dónde redirige. Si NO hay, indícalo.
6. Base de datos: ¿hay una variable de conexión directa a Postgres en .env.local? (solo NOMBRES, nunca valores). Indica cuál es y su nombre exacto; se asume copiada desde Vercel.
7. Dónde viven los datos hoy, si hay algo.
8. Migraciones: ¿mecanismo? Si no, se crea.
9. Qué del dominio ya está construido: productos, lotes, movimientos. Estado de cada uno.
10. Estilos: versión de Tailwind, globals.css, tokens, fuentes.
11. Pruebas: framework (Vitest u otro) y pruebas existentes.
12. Conflictos: existencia previa de app/tienda, app/api/tienda, lib/dataService, components/ui; contenido de app/page.tsx; tablas productos/lotes/movimientos.
13. Decisiones derivadas: ¿hay base Next o hay que correr P-INIT?; ruta de login; archivo de protección (proxy.ts en Next 16); mecanismo de migraciones; nombre de la variable de conexión a Postgres; nombres de M1 y M2; prefijo de imports; dónde está app/.
14. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea doc/DICTAMEN.md: para cada pieza de INFRAESTRUCTURA (proyecto Next/TS, Tailwind, conexión Postgres, login, migraciones) y cada funcionalidad del módulo mínimo (F1 entrada, F2 venta, F3 consulta de stock, F4 alerta de reorden, más el catálogo de productos), di su estado (EXISTE Y SIRVE / EXISTE PARCIAL / NO EXISTE) y qué hacer (USAR / ADAPTAR / CREAR), con el prompt donde se trata. Incluye una tabla resumen y una lista de "qué necesita conseguir el estudiante".

TAREA 3. Crea .github/copilot-instructions.md reemplazando [AJUSTAR] con lo hallado:

```markdown
# Inventario de Tienda · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_TIENDA.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Dictamen: doc/DICTAMEN.md. Antes de crear algo, revisa si dice USAR.
- Avance: doc/ESTADO_EJECUCION.md.

## Stack objetivo
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con pg y la variable [AJUSTAR: conexión]. (pg [AJUSTAR: está / falta].)
- Validación con Zod. Pruebas con Vitest.
- Login: [AJUSTAR: existe / se agrega] como puerta única, sin roles.

## Lo más importante del dominio
- El stock de un producto es la SUMA de las cantidades de sus lotes NO vencidos; no se guarda un stock aparte.
- La venta descuenta por FEFO (first expired, first out): primero el lote que vence antes; los no perecederos por orden de entrada. Se resuelve en una transacción con los lotes bloqueados; nunca deja stock negativo.
- Punto de reorden fijo 10: un producto se marca para reordenar con stock <= 10 (10 inclusive).
- Vencimiento: lote "por vencer" con 5 días o menos (5 inclusive); "vencido" si la fecha ya pasó; un lote vencido no se puede vender.
- Solo los perecederos exigen fecha de vencimiento al entrar; los no perecederos no.
- Una venta de cantidad igual al stock se permite (queda en 0); mayor se rechaza entera.
- El estado (reorden, por vencer, vencido) se calcula al leer, no se guarda.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto fechas.ts). Se prueban con Vitest.
- Las constantes (reorden 10, aviso 5 días) viven en lib/config/tienda.ts.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/tienda/ llama await exigirSesion() como primera instrucción.
- Cantidades enteras. Fechas 'YYYY-MM-DD'. Zona horaria America/Bogota; "hoy" solo con hoyBogota().
- En rutas dinámicas params es una Promise: const { codigo } = await params.
- SQL siempre con parámetros. Nunca concatenar valores.
- Un producto se desactiva, no se elimina. Lotes y movimientos no se editan.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: [AJUSTAR]. Archivo de protección: [AJUSTAR]. Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa y hace el commit.
```

TAREA 4. Si hay proyecto Next y falta node_modules, ejecuta npm install y luego npm run build; registra el resultado en la sección 14. Si no hay proyecto, NO lo crees aquí: dilo en el dictamen (hay que correr P-INIT).

TAREA 5. Crea doc/ESTADO_EJECUCION.md con la tabla de prompts (P-INIT, P00 a P09) y una sección de bitácora.

TAREA 6. Confírmame que las credenciales del plan funcional deben haberse rotado (advertencia de seguridad). Revisa .env.local y dime qué variable de conexión a Postgres hay (copiada desde Vercel) y su nombre exacto; para lib/db/conexion.ts se usa la del pooler (puerto 6543), no la de 5432. Si no hay ninguna, avísame. Solo confírmame el nombre.

RESTRICCIONES: no modifiques código, configuración ni dependencias. Solo creas los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: estado de la infraestructura, resumen del dictamen y qué necesita conseguir el estudiante.
- Marca P00 en ESTADO_EJECUCION.md.
- Muéstrame el dictamen resumido y el nombre de la variable de conexión antes de P01.
````

**Verificación del estudiante:** leer `doc/DICTAMEN.md`. Dice qué ya tienes, qué falta y qué se va a crear, y confirma el nombre de la variable de conexión (la del pooler, 6543). Si dice que no hay proyecto Next, correr P-INIT primero.

**Commit sugerido:** `docs: conciliación y dictamen del inventario de tienda`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea o usa:** dependencia `pg`, migraciones M1 y M2, `scripts/verificar-bd.mjs`, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 7, 8, 10 y 16), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Si el dictamen dice que falta la conexión a Postgres, detente y avísame.

OBJETIVO: crear las tablas en Supabase Postgres y dejar un script que demuestre que la base protege las reglas (código único, categoría válida, cantidades no negativas, vencimiento ≥ entrada).

TAREA 1. Si falta pg, agrégalo (y @types/pg).

TAREA 2. Crea en supabase/migrations/ dos archivos con los nombres de la sección 13 de ESTADO_ACTUAL.md:
- M1 (tablas productos, lotes, movimientos) con el SQL exacto de la sección 10.2 del plan.
- M2 (vista v_productos y seguridad) con el SQL exacto de la sección 10.3.
No cambies nombres, columnas ni restricciones: el código depende de ellos (sección 10.4).

TAREA 3. Aplica las migraciones con el mecanismo existente o creando scripts/migrar.mjs (patrón estándar) y "db:migrar". Ejecútalo.

TAREA 4. Crea scripts/verificar-bd.mjs y "db:verificar". Debe imprimir:
1. Existencia de productos, lotes, movimientos y la vista v_productos.
2. Número de filas de cada tabla.
3. Restricciones e índices: productos_codigo_unico, productos_categoria_valida, lotes_cantidad_no_neg, lotes_fechas_coherentes, mov_cantidad_positiva.
4. Si RLS está activo en las tres tablas.
5. Pruebas de integridad en UNA transacción que SIEMPRE termina en ROLLBACK, con SAVEPOINT antes de cada caso que debe fallar:
   a) Crear producto "TD-A" (perecedero): funciona; crear "TD-A" otra vez: 23505 (productos_codigo_unico).
   b) Crear producto con categoria 'otra': 23514 (productos_categoria_valida).
   c) Insertar un lote con cantidad −1: 23514 (lotes_cantidad_no_neg).
   d) Insertar un lote con fecha_vencimiento anterior a fecha_entrada: 23514 (lotes_fechas_coherentes).
   e) Insertar un movimiento con cantidad 0: 23514 (mov_cantidad_positiva).
   f) Insertar dos lotes de TD-A (uno vence pronto, otro después) y comprobar que v_productos.stock_disponible suma ambos si no están vencidos.
   g) Insertar un lote de TD-A con fecha_vencimiento anterior a hoy y comprobar que NO cuenta en stock_disponible (sí en stock_total).
   Imprime OK o FALLA por caso.
6. Total de fallas; código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques el login ni app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida de db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase aparecen `productos`, `lotes`, `movimientos`. La salida de `npm run db:verificar` no tiene FALLA; el caso g confirma que un lote vencido no cuenta en el stock disponible.

**Commit sugerido:** `feat(bd): productos, lotes, movimientos y vista de stock`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/tienda.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 6, 7, 8, 11, 12.2 y 17.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas puras y probarlas con Vitest. El núcleo son el vencimiento, el reorden, la suficiencia de stock y el descuento FEFO, con sus casos límite.

TAREA 1. Si falta Vitest, instálalo y configúralo (environment node, include ['tests/**/*.test.ts'], alias de tsconfig). Si ya hay Vitest, respétalo.

TAREA 2. Crea lib/config/tienda.ts con el contenido de la sección 11.4 (PUNTO_REORDEN 10, DIAS_AVISO_VENCIMIENTO 5, categorías, zona horaria).

TAREA 3. Crea lib/reglas/ con las firmas de la sección 11.5:
- errores.ts: CodigoError; MENSAJES y ESTADO_HTTP (tabla 12.2); clase ErrorDeNegocio.
- fechas.ts: hoyBogota; esFechaValida; diasEntre(desde, hasta) (con Date.UTC).
- vencimiento.ts: EstadoVencimiento; estadoVencimiento(fecha, hoy, diasAviso) (dias<0 vencido; dias<=diasAviso por_vencer; si no vigente; RN-02); estaVencido(fecha, hoy).
- inventario.ts: TipoMovimiento; validarCantidad(cantidad) (entero > 0, RN-08); hayStockSuficiente(disponible, cantidad) (cantidad <= disponible, RN-03); descontarPorFefo(lotes, cantidad) (lotes ya ordenados; devuelve el plan de descuento por lote; recorre restando hasta cubrir la cantidad; RN-07).
- alertas.ts: paraReordenar(stockDisponible, puntoReorden) (<= , RN-01).
- producto.ts: Categoria; validarProducto({codigo, nombre, categoria}) (no vacíos; categoría válida; RN-09).
- lote.ts: validarEntrada({cantidad, categoria, fechaEntrada, fechaVencimiento}) (cantidad > 0; si perecedero exige vencimiento, RN-04; vencimiento >= entrada, RN-12).

Ninguna regla importa pg, red, next ni process.env, ni llama new Date() (excepto el parámetro por defecto de hoyBogota).

TAREA 4. Crea tests/reglas/ayudas.ts con esperarCodigo(fn, codigo). Crea las pruebas (vencimiento, inventario, alertas, fefo, producto, lote) cubriendo T-01 a T-26 de la sección 17.1, con hoy = '2026-06-15'. Cada caso con su ID. Lo crítico: reorden 10 inclusive; vencimiento 5 días inclusive y vencido; venta igual al stock permite y mayor no; perecedero sin vencimiento rechaza; y el descuento FEFO (T-23, T-24: descuenta primero del lote que vence antes).

TAREA 5. Ejecuta npm test hasta que pasen las 26. Si una falla, corrige la regla, no la prueba, salvo que contradiga el plan; explícalo.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida de npm test.
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm test` (26 pruebas). Abrir `lib/reglas/inventario.ts` y comprobar el descuento FEFO (primero el lote que vence antes) y que una venta igual al stock se permite.

**Commit sugerido:** `feat(reglas): vencimiento, reorden, FEFO y stock con 26 pruebas`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión, respuestas, esquemas, formato · **Modifica:** protección de rutas

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 1.3, 5, 10.4, 11, 12.1, 12.2, 12.4, 15 y 16), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: la infraestructura del servidor y el acceso.

TAREA 1. lib/db/conexion.ts como la sección 11.7 (con los parsers). Usa el nombre real de la variable de conexión que confirmó P00 (la del pooler, 6543). Si P-INIT ya la creó, reutilízala.

TAREA 2. lib/auth/sesion.ts: obtenerSesion() y exigirSesion(). Si hay login (de P-INIT o existente), envuélvelo sin reescribirlo; si no, agrégalo mínimo como puerta. exigirSesion() lanza NO_AUTORIZADO si no hay sesión.

TAREA 3. Protección de rutas (proxy.ts en Next 16, o el del dictamen): protege /tienda/:path* y /api/tienda/:path*. Sin sesión: páginas a /login; API 401 con el formato de la sección 12.1.

TAREA 4. Tras iniciar sesión, redirige a /tienda. app/page.tsx redirige a /tienda (o a /login si no hay sesión).

TAREA 5. lib/http/respuestas.ts: responderOk; responderError (ErrorDeNegocio → ESTADO_HTTP; ZodError → 400 DATOS_INVALIDOS con flatten; pg 23505/23503/23514 → tabla 10.4 por error.constraint; otro → console.error y 500 ERROR_INTERNO); conManejoDeErrores; leerCuerpo. Todas con Cache-Control: no-store.

TAREA 6. lib/validacion/esquemas.ts con los esquemas de la sección 12.4, con tipos z.infer. No importa nada del servidor.

TAREA 7. lib/formato.ts: formatearFecha (Intl es-CO, dateStyle medium, timeZone UTC).

TAREA 8. app/api/tienda/sesion/route.ts: GET con conManejoDeErrores; primera instrucción await exigirSesion(); responde { email }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Inicia npm run dev; sin sesión, la ruta de sesión da 401 y /tienda redirige al login. Inicia sesión y comprueba que llega a /tienda.

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** sin sesión, `/tienda` redirige al login; con sesión, entra.

**Commit sugerido:** `feat(servidor): conexión, sesión y utilidades de API`

---

## P04 · Datos: productos, entradas y salidas

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/*`, `lib/dataService.ts`, scripts de prueba y demo

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 6, 7, 8, 9, 9.1, 10, 11.5, 11.6 y 17.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: la capa de datos y los casos de uso contra Postgres, con transacciones, y comprobar el flujo. Lo crítico: el stock derivado de lotes, la venta FEFO atómica y las alertas.

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 11.6.

TAREA 2. lib/datos/productos.ts:
- listarInventario({ soloReorden, busqueda }) desde v_productos; calcula paraReordenar con el stock disponible y hoyBogota(); orden por nombre.
- crearProducto(d) (validarProducto; PRODUCTO_DUPLICADO si choca; stock 0).
- obtenerProducto(codigo) con sus lotes (cada uno con estadoVencimiento) y movimientos recientes; PRODUCTO_NO_ENCONTRADO si no.
- desactivarProducto(codigo).

TAREA 3. lib/datos/entradas.ts:
- registrarEntrada(d): validarEntrada (RN-04, RN-12); en transacción, inserta un lote (con vencimiento si perecedero) y registra el movimiento de entrada; devuelve el nuevo stock disponible.

TAREA 4. lib/datos/salidas.ts:
- registrarSalida(codigo, cantidad): secuencia EXACTA de la sección 9.1 dentro de conTransaccion (validarCantidad; obtener el producto; bloquear los lotes NO vencidos ordenados por vencimiento ascendente —FEFO; los no perecederos por fecha de entrada—; sumar su stock; si no alcanza, STOCK_INSUFICIENTE y revertir; descontar por FEFO con descontarPorFefo, actualizando cada lote; registrar el movimiento de salida). Devuelve { stock, paraReordenar }.

TAREA 5. lib/datos: funciones de alertas y reportes (reportes solo preparado para P09): productosParaReordenar() (stock disponible <= 10); lotesPorVencer() y reporteRotacion() se dejan para P09.

TAREA 6. lib/dataService.ts como fachada: reexporta las funciones públicas y los tipos. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 7. scripts/limpiar-prueba.mjs ("db:limpiar") y scripts/cargar-demo.ts ("db:demo"): demo con productos perecederos y no perecederos, lotes con distinta fecha de vencimiento (alguno por vencer, alguno vencido), y algún producto bajo el punto de reorden. Limpia los demo antes. Ejecútalo.

TAREA 8. Instala tsx si falta. scripts/probar-flujo.ts ("probar:flujo") con los 14 pasos de la sección 17.2 usando solo dataService (fechas relativas a hoy). Imprime OK/FALLA por paso; los que esperan error verifican el código; limpia antes y en finally; cierra el pool; código 1 si hay fallas. CRÍTICO: el paso 4 (perecedero sin vencimiento rechaza); el 9 (venta FEFO descuenta primero del lote que vence antes y deja para reordenar); el 10 (venta que excede se rechaza); el 11 (venta igual al stock queda en 0); el 14 (un lote vencido no se vende). Ejecuta y corrige hasta 0 fallas.

RESTRICCIONES: no romper el login ni las pruebas. No dupliques lógica (vive en lib/reglas/).

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega la salida de probar:flujo y db:demo en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run probar:flujo` (14 OK, 0 fallas). El paso 9 confirma el descuento FEFO y el 14 que un lote vencido no se vende.

**Commit sugerido:** `feat(datos): productos, entradas y salidas con FEFO`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `app/api/tienda/`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 12.1 a 12.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesion.ts.

OBJETIVO: exponer las operaciones del módulo mínimo con rutas protegidas.

TAREA 1. Crea las rutas del módulo mínimo de la tabla 12.3 (deja vencimientos y rotación para P09). Reglas de cada handler:
- Primera instrucción: await exigirSesion().
- conManejoDeErrores; cuerpos con leerCuerpo y los esquemas de 12.4; filtros validados.
- [codigo] con await params.
- export const dynamic = 'force-dynamic'.
- POST de crear, entrada y salida responden 201.

TAREA 2. Verificación sin sesión: con npm run dev, GET /api/tienda/productos y POST /api/tienda/salidas deben dar 401.

TAREA 3. Verificación con sesión: pídeme que inicie sesión. Crea un producto perecedero y uno no perecedero; registra una entrada con vencimiento y otra sin (en el no perecedero); intenta una entrada de perecedero sin vencimiento (400); registra una venta normal y otra que exceda el stock (409); comprueba que un producto con stock ≤ 10 aparece para reordenar. Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con probar:flujo (P04) y las verificaciones.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** las rutas dan 401 sin sesión; con sesión, una venta que excede el stock se rechaza y un perecedero sin vencimiento no entra.

**Commit sugerido:** `feat(api): rutas de productos, entradas, salidas y alertas`

---

## P06 · Interfaz base e inventario con alertas

**Fase:** 5 · **Crea:** `components/ui/*`, layout de `/tienda`, inventario · **Modifica:** `app/globals.css`, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 5, 6, 8, 13, 14), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: componentes reutilizables, navegación y la pantalla de inventario con las alertas de reorden.

TAREA 1. Agrega los tokens de color de la sección 14 sin borrar nada existente (Tailwind 4: @theme; Tailwind 3: tailwind.config).

TAREA 2. components/ui/: Boton (primario, secundario, peligro, fantasma; prop cargando), Campo, Selector, Tarjeta, Insignia (tono neutro, normal, reorden, vencido, inactivo), Aviso (info, exito, advertencia, error), EstadoVacio. Foco visible y contraste.

TAREA 3. app/page.tsx: redirección a /tienda (o a /login si no hay sesión). Si P-INIT dejó una página de inicio, consérvala y asegura la redirección.

TAREA 4. components/tienda/NavegacionTienda.tsx y app/tienda/layout.tsx (servidor): obtenerSesion(); sin sesión, redirect al login. Barra con "Mi Tienda", enlaces Inventario, Entrada, Venta (y Vencimientos/Rotación cuando existan); cerrar sesión. Mobile-First.

TAREA 5. components/tienda/InsigniaEstado.tsx (Normal, Para reordenar, Vencido; con texto además de color).

TAREA 6. Inventario: components/tienda/TablaInventario.tsx, PanelAlertas.tsx y app/tienda/page.tsx (servidor): listarInventario; columnas código, nombre, categoría, stock disponible, estado (InsigniaEstado). Buscador y filtro "solo para reordenar". PanelAlertas arriba con los productos para reordenar. Botón "Nuevo producto". EstadoVacio si no hay. Tarjetas apiladas en móvil.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos demo: ver el inventario y el panel de productos para reordenar; buscar un producto; filtrar "solo para reordenar". Revisa en móvil.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver el inventario con el stock de cada producto y el panel de "para reordenar".

**Commit sugerido:** `feat(interfaz): inventario con alertas de reorden`

---

## P07 · Productos y registro de entradas

**Fase:** 5 · **Crea:** alta de producto y registro de entrada de mercancía

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 6, 7, 8, 13, 15), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: crear productos y registrar entradas de mercancía (con lote y vencimiento si es perecedero).

TAREA 1. components/tienda/FormularioProducto.tsx (cliente) y app/tienda/productos/nuevo/page.tsx: código, nombre, categoría (perecedero / no perecedero), proveedor. POST /api/tienda/productos; PRODUCTO_DUPLICADO muestra el mensaje. Nace con stock 0.

TAREA 2. components/tienda/FormularioEntrada.tsx y app/tienda/entrada/page.tsx: producto (selector o código), cantidad, fecha de entrada (por defecto hoy) y, SOLO si el producto es perecedero, fecha de vencimiento (obligatoria; el campo aparece según la categoría del producto elegido). POST /api/tienda/entradas; perecedero sin vencimiento y vencimiento anterior a la entrada muestran su mensaje. Al guardar, muestra el nuevo stock.

TAREA 3. components/tienda/TablaLotes.tsx y app/tienda/productos/[codigo]/page.tsx (servidor): obtenerProducto (notFound si no existe); muestra los datos, el stock, la tabla de lotes (cantidad, entrada, vencimiento, estado del lote con InsigniaEstado) y los movimientos recientes.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Crear un producto perecedero y uno no perecedero; registrar una entrada con vencimiento al perecedero (ver el stock subir) y una sin vencimiento al no perecedero; intentar una entrada de perecedero sin vencimiento (error); ver los lotes en el detalle con su estado. Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** crear productos y registrar entradas; comprobar que el perecedero exige fecha de vencimiento y el no perecedero no.

**Commit sugerido:** `feat(interfaz): productos y entradas de mercancía`

---

## P08 · Venta y aceptación del MVP

**Fase:** 5 y 6 · **Crea:** registro de venta, `doc/ACEPTACION.md` · **Modifica:** `README.md`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 6, 7, 8, 9.1, 13, 15, 16, 17 y 18), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: registrar ventas (con FEFO y control de stock), y cerrar el módulo mínimo con la aceptación.

TAREA 1. components/tienda/FormularioVenta.tsx (cliente) y app/tienda/venta/page.tsx: producto (selector o código), cantidad. Muestra el stock disponible del producto elegido; al vender (POST /api/tienda/salidas), descuenta por FEFO y muestra el nuevo stock, o el rechazo (STOCK_INSUFICIENTE con el disponible). Si el producto quedó para reordenar, lo indica con el texto de la sección 13.1.

TAREA 2. Revisa el código contra las secciones 7, 8 y 16. Reporta y corrige en la bitácora: stock guardado como campo en vez de derivado de lotes; venta que no use FEFO o que no bloquee los lotes; venta que deje stock negativo o que tome lotes vencidos; "hoy" con new Date() fuera de fechas.ts; perecedero sin vencimiento aceptado; cantidad ≤ 0 aceptada; rutas sin exigirSesion; SQL concatenado; estado comunicado solo con color; y que las credenciales viejas se hayan rotado (recordatorio).

TAREA 3. Ejecuta npm test y npm run probar:flujo; corrige fallas en el código. Prepara la aceptación: db:limpiar --prueba; conserva los demo.

TAREA 4. Crea doc/ACEPTACION.md con la tabla A-01 a A-13 de la sección 17.3 (columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación; las tres últimas vacías) y una nota de que A-11 y A-12 son de las opcionales (P09).

TAREA 5. Actualiza README.md: descripción; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, db:migrar, db:demo, dev); scripts; una nota sobre el stock derivado de lotes, el FEFO, el punto de reorden (10) y el vencimiento (5 días); enlace a doc/PLAN_TIENDA.md.

TAREA 6. Verifica que .env.local esté en .gitignore y que ningún archivo versionado tenga valores de variables de entorno (en especial, ningún .env con las claves viejas).

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md (interfaz) y doc/checkpoints/FASE_6_COMPLETADA.md (revisión y pruebas).
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que A-01 a A-10 y A-13 se ejecutan en el despliegue de Vercel.
````

**Verificación del estudiante:** registrar una venta (ver el stock bajar por FEFO); intentar vender más que el stock (rechazo); dejar un producto en ≤ 10 y verlo en "para reordenar". Hacer push y ejecutar A-01 a A-10 y A-13 en Vercel.

**Commit sugerido:** `feat(interfaz): venta con FEFO y aceptación del MVP`

---

## P09 · Opcionales: alertas de vencimiento y reporte de rotación

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_TIENDA.md (secciones 4.2, 6.2, 9 (CU-06, CU-07), 17.3 (A-11, A-12) y 19), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: las dos mejoras opcionales.

TAREA 1. F5 · Alertas de vencimiento:
- lib/datos: lotesPorVencer(): lotes con estadoVencimiento por_vencer (≤ 5 días) y vencidos, con su producto y fecha, calculado con hoyBogota(). Reexporta en dataService.
- Ruta GET /api/tienda/vencimientos; pantalla /tienda/vencimientos con dos listas (por vencer y vencidos).

TAREA 2. F6 · Reporte de rotación:
- reporteRotacion(desde, hasta): suma las salidas por venta de cada producto en el rango y las ordena de mayor a menor. Reexporta en dataService.
- Ruta GET /api/tienda/rotacion; pantalla /tienda/rotacion con un selector de rango de fechas y la tabla ordenada.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos demo: ver los lotes por vencer y los vencidos; ver el reporte de rotación de un rango (verifica a mano el más vendido). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Agrega a doc/ACEPTACION.md los resultados de A-11 y A-12.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver los lotes por vencer y vencidos; ver el reporte de rotación con los productos más vendidos del periodo.

**Commit sugerido:** `feat(opcional): alertas de vencimiento y reporte de rotación`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/DICTAMEN.md, doc/PLAN_TIENDA.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/DICTAMEN.md, doc/PLAN_TIENDA.md y doc/PROMPTS_TIENDA.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel —incluida la conexión a Postgres—, o diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````
