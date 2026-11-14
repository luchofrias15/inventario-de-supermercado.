# Inventario de Tienda · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: `doc/PLAN TIENDA.md` (el nombre actual contiene espacios). Si una instrucción contradice el plan, prevalece el plan.
- Prompts: `doc/PROMPTS TIENDA.md` (el nombre actual contiene espacios).
- Estado real del repositorio: `doc/ESTADO_ACTUAL.md`.
- Dictamen: `doc/DICTAMEN.md`. Antes de crear algo, revisa si dice USAR.
- Avance: `doc/ESTADO_EJECUCION.md`.

## Stack objetivo
- Next.js App Router + TypeScript + Tailwind CSS. La aplicación vive en `src/app/`; despliegue objetivo en Vercel.
- Postgres de Supabase con `pg` y la variable `INVENTARIO_POSTGRES_URL` (pooler, puerto 6543). `pg` falta y se incorpora en P01.
- Validación con Zod. Pruebas con Vitest.
- Login existente en `/login` con Supabase Auth; adaptarlo como puerta única, sin roles, y no reescribirlo.

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
- Reglas de negocio solo en `src/lib/reglas/`: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto `fechas.ts`). Se prueban con Vitest.
- Las constantes (reorden 10, aviso 5 días) viven en `src/lib/config/tienda.ts`.
- Solo `src/lib/datos/` importa `src/lib/db/conexion.ts`. Rutas y páginas importan datos únicamente desde `src/lib/dataService.ts`.
- Toda ruta en `src/app/api/tienda/` llama `await exigirSesion()` como primera instrucción.
- Cantidades enteras. Fechas `YYYY-MM-DD`. Zona horaria `America/Bogota`; "hoy" solo con `hoyBogota()`.
- En rutas dinámicas `params` es una Promise: `const { codigo } = await params`.
- SQL siempre con parámetros. Nunca concatenar valores.
- Un producto se desactiva, no se elimina. Lotes y movimientos no se editan.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar `src/components/ui/`.
- Prefijo de imports: `@/*` apunta a `src/*`. Archivo de protección por implementar en P03: `src/proxy.ts` (verificar la guía local de Next 16 antes de editar). Ruta de login existente: `/login`.

## Al terminar cada tarea
1. Ejecutar `npm run build` sin errores.
2. Ejecutar `npm test` sin fallas desde que existan las pruebas de reglas.
3. Actualizar `doc/ESTADO_EJECUCION.md`.
4. No hacer commit: el estudiante revisa y hace el commit.
