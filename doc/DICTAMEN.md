# Dictamen P00 · Inventario de Tienda

## Resumen

El repositorio ya tiene una base Next.js 16 con TypeScript, Tailwind 4, Vitest y un login conectado a Supabase Auth. No hay que ejecutar P-INIT. Sin embargo, la aplicación funcional actual es un inventario distinto: los productos y categorías viven en JSON local, no hay lotes ni movimientos, y el dashboard no implementa entradas, ventas FEFO ni el umbral de reorden del plan.

Hay variables Postgres en `.env.local`. Para la conexión Node/`pg`, usar `INVENTARIO_POSTGRES_URL` (pooler, puerto 6543); no usar `INVENTARIO_POSTGRES_URL_NON_POOLING` (puerto 5432). No se verificó la conexión. La compilación quedó pendiente porque `npm` no está disponible en esta terminal.

La seguridad del plan confirma que las credenciales expuestas deben rotarse antes de continuar. El estudiante confirmó que ya completó la rotación. Ningún valor secreto se leyó para este dictamen ni se incluyó en documentación.

## Estado y acción recomendada

| Pieza | Estado | Acción | Prompt |
|---|---|---|---|
| Proyecto Next.js / TypeScript | EXISTE Y SIRVE como base instalada; compilación pendiente de verificar | USAR | P00; no ejecutar P-INIT |
| Tailwind CSS | EXISTE Y SIRVE (v4), aunque aún no tiene los tokens de tienda | ADAPTAR con `@theme`, preservando estilos | P06 |
| Supabase Auth / login | EXISTE PARCIAL: login y cookies existen, pero no hay sesión de servidor ni protección de rutas | ADAPTAR sin reescribir; mantener `/login` | P03 |
| Conexión Postgres | EXISTE PARCIAL: variable pooler local presente; no está conectada desde la aplicación ni probada | ADAPTAR usando `INVENTARIO_POSTGRES_URL`; probar acceso | P01, P03 |
| Migraciones | EXISTE PARCIAL: carpeta y migración de perfiles; no existe el esquema de inventario ni configuración local de Supabase CLI confirmada | ADAPTAR y crear M1/M2; confirmar proyecto remoto antes de aplicar | P01 |
| Catálogo de productos | EXISTE PARCIAL: CRUD genérico sobre JSON, con modelo distinto | ADAPTAR al producto de tienda; stock inicial derivado de lotes | P04, P05, P07 |
| F1 · Entradas | NO EXISTE | CREAR, incluyendo lote y movimiento transaccional | P02, P04, P05, P07 |
| F2 · Ventas | NO EXISTE | CREAR con control de stock, bloqueo de lotes y FEFO | P02, P04, P05, P08 |
| F3 · Consulta de stock | EXISTE PARCIAL: dashboard consulta productos JSON con stock guardado | ADAPTAR al stock calculado de lotes no vencidos | P04, P06 |
| F4 · Alerta de reorden | EXISTE PARCIAL: alerta basada en `minStock`, no en el umbral fijo 10 | ADAPTAR para stock disponible `<= 10` | P02, P06, P08 |
| F5 · Alertas de vencimiento | NO EXISTE | CREAR solo después de cerrar el MVP | P09 |
| F6 · Reporte de rotación | NO EXISTE | CREAR solo después de cerrar el MVP | P09 |

## Qué necesita conseguir o verificar el estudiante

1. La rotación de credenciales del plan se confirmó como completada. Mantener `.env.local` fuera de Git; está excluido por `.gitignore`. No pegar valores en chats ni documentos.
2. Confirmar que `INVENTARIO_POSTGRES_URL` contiene la cadena vigente del pooler (6543) y que la misma conexión está configurada en el entorno de despliegue. No compartir la cadena.
3. Confirmar que el proyecto Supabase existe y que el equipo puede aplicar migraciones en él. No se pudo verificar el estado remoto ni la conectividad desde esta terminal.
4. Habilitar Node.js/npm en el PATH de la terminal y ejecutar `npm run build`; el intento P00 no pudo iniciar.
5. Antes de P01, verificar los documentos del proyecto: el plan y los prompts están nombrados con espacios (`PLAN TIENDA.md`, `PROMPTS TIENDA.md`), aunque algunos bloques los referencian con guiones bajos.

## Nombres propuestos de migraciones

- M1: `20261114090000_tienda_tablas.sql`
- M2: `20261114090100_tienda_vista_seguridad.sql`

Se conserva el esquema existente de perfiles; las migraciones del inventario deben crear únicamente las tablas y vista indicadas por el plan.
