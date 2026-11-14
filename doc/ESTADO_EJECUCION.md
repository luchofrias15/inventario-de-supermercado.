# Estado de ejecución · Inventario de Tienda

P-INIT no aplica: el proyecto Next.js ya existe. Las fases restantes siguen el orden y las dependencias de `doc/PLAN TIENDA.md`.

| Prompt | Estado | Evidencia / nota |
|---|---|---|
| P-INIT | No aplica | Ya existe proyecto Next.js, login y conexión Supabase configurada localmente. |
| P00 | COMPLETADO | Auditoría creada; la rotación de credenciales fue confirmada. Node.js/npm se instaló después y el build se verificó en P01. |
| P01 | COMPLETADO | M1/M2 aplicadas en Supabase; `db:verificar` pasó con 0 fallas y rollback confirmado. Build correcto. |
| P02 | COMPLETADO | 26 pruebas de reglas y 8 pruebas existentes pasan (34 en total); `type-check` y build correctos. |
| P03 | COMPLETADO | Pool Postgres, validación de sesión Supabase, respuestas/esquemas, Proxy Next 16 y redirecciones. Acceso anónimo probado; autenticación real se verificará cuando exista la pantalla `/tienda` en P06. |
| P04 | COMPLETADO | Capa transaccional, demo y flujo de 14 pasos correcto; datos de prueba limpiados, demo conservado. |
| P05 | Implementado; autenticación real pendiente | Endpoints protegidos para sesión, productos, entradas, salidas y alertas; probado el rechazo sin sesión. |
| P06 | Implementado; prueba visual pendiente | Inventario adaptable, búsqueda, filtro de reorden y alertas. |
| P07 | Implementado; prueba visual pendiente | Alta de producto, entradas y detalle de lotes/movimientos. |
| P08 | Implementado; aceptación en Vercel pendiente | Venta FEFO; pruebas locales correctas. Vercel informa que no hay Production Deployment. |
| P09 | Implementado; prueba visual autenticada pendiente | Alertas de vencimiento y reporte de rotación; consultas de solo lectura verificadas en PostgreSQL. |

## Bitácora

### P00 · Conciliación · 2026-11-14

- Confirmado proyecto Next.js 16.3.5 + TypeScript 5.8.2 + React 19 + Tailwind 4, con `src/app/`.
- Confirmado login de Supabase Auth existente; sin protección de rutas ni API.
- Confirmada variable recomendada `INVENTARIO_POSTGRES_URL` (pooler, puerto 6543). No se registraron valores secretos ni se probó la conexión.
- Confirmado que productos/categorías usan JSON local; no existen lotes, movimientos ni funcionalidad FEFO del plan.
- Creado el dictamen y la radiografía del repositorio. La rotación de credenciales expuestas fue confirmada por el estudiante.
- `npm run build`: no pudo iniciarse porque `npm` no se reconoce en esta terminal. Reintentar antes de P01.
- Documentos de entrada conservados con sus nombres actuales con espacios; se anotó la diferencia frente a las referencias con guiones bajos.

No se han creado commits.

### P01 · Base de datos · 2026-11-14

- Agregadas `pg`, `@types/pg`, los comandos `db:migrar` y `db:verificar`, y las migraciones M1/M2 con los nombres indicados en la radiografía.
- El pooler existente contiene `sslmode`, que hacía que node-postgres ignorara `rejectUnauthorized: false`. Los scripts normalizan ese parámetro solo en memoria antes de crear el pool, respetando la configuración SSL del plan y sin revelar la cadena.
- `npm run db:migrar`: aplicó `20261003120000_create_profiles.sql`, M1 `20261114090000_tienda_tablas.sql` y M2 `20261114090100_tienda_vista_seguridad.sql`.
- `npm run db:verificar`: tablas y vista presentes; productos 0, lotes 0, movimientos 0, vista 0; las cinco restricciones verificadas; RLS activo en las tres tablas; pruebas a–g correctas; transacción revertida; 0 fallas.
- `npm run build`: correcto. Sigue la advertencia preexistente de trazado dinámico de `data/` desde `src/lib/json-db.ts`.

### P03 · Infraestructura del servidor · 2026-11-14

- Añadidos el pool `pg` con parsers y transacciones, el adaptador de sesión que valida el access token con Supabase Auth, respuestas sin caché, esquemas Zod y formato de fecha.
- Añadido `src/proxy.ts` siguiendo la convención vigente de Next.js 16. Sin cookie, `/tienda` redirige a `/login` y `/api/tienda/sesion` responde 401 `NO_AUTORIZADO`.
- El login existente ahora navega a `/tienda`; `/` valida la sesión y redirige a `/tienda` o `/login`.
- Validación autenticada queda para cuando P06 cree una página de tienda; todavía no se puede confirmar la llegada a una pantalla real.
- `npm test`: 34 pruebas correctas; `npm run type-check` y `npm run build`: correctos.

### P04 · Datos y flujo de prueba · 2026-11-14

- Capa de datos parametrizada en `src/lib/datos/`, con stock calculado usando `hoyBogota()` y ventas con lotes bloqueados y FEFO dentro de una transacción.
- `npm run db:demo`: dos productos demo y cuatro lotes cargados.
- `npm run probar:flujo`: 14 escenarios correctos, 0 fallas; lotes y movimientos de prueba eliminados en `finally`; demo conservado.
- Se corrigió la expectativa de P04, paso 8, en el plan: 8 unidades sí deben alertar, porque `8 <= 10` (RN-01). El texto previo contradecía la regla.
- `npm run db:verificar`: 0 fallas, RLS y restricciones activos; regresión siempre revertida.
- `npm test`: 34 correctas; type-check y build correctos.

### P02 · Reglas de negocio · 2026-11-14

- Implementadas constantes, códigos de error, fechas Bogotá, vencimiento, stock, FEFO, validación de producto y lote.
- Vitest ahora usa entorno `node` y descubre tanto las pruebas existentes de `src/` como `tests/reglas/**/*.test.ts`.
- `npm test`: 9 archivos, 34 pruebas correctas (26 casos T-01 a T-26 y 8 pruebas existentes).
- `npm run type-check`: correcto.
- `npm run build`: correcto, con la misma advertencia preexistente de acceso dinámico a archivos en `src/lib/json-db.ts`.

### P05–P08 · API, interfaz y aceptación · 2026-11-14

- P05: API protegida para sesión, productos, entradas, salidas y alertas. Los endpoints de tienda y el API JSON anterior exigen una sesión Supabase válida; se probaron las respuestas anónimas `401`. La validación autenticada queda pendiente de una prueba manual con cuenta del usuario.
- P06–P07: interfaz adaptable con inventario, alertas, búsqueda/filtro, alta de producto, entradas y detalle de lotes/movimientos.
- P08: formulario de venta conectado a `POST /api/tienda/salidas`, muestra stock, resultado y disponibilidad en rechazos `STOCK_INSUFICIENTE`. La venta existente descuenta lotes mediante FEFO dentro de una transacción.
- Revisión de reglas: el stock se deriva de lotes no vencidos; las filas vendibles se bloquean al vender; la validación del servidor impide stock negativo, lotes vencidos, fechas faltantes en perecederos y cantidades no positivas. Las consultas SQL usan parámetros. Las fechas de negocio usan `hoyBogota()` y los estados incluyen texto, no solo color.
- La cuenta confirmó la rotación previa de las credenciales expuestas. `.env.local` está ignorado y `.env.example` contiene solo nombres de variables sin valores.
- Creada `doc/ACEPTACION.md` con A-01 a A-13 y resultados locales diferenciados de la aceptación remota.
- Revalidación P08: `npm test` 38/38; `npm run probar:flujo` 14 escenarios, 0 fallas; `npm run db:verificar` 0 fallas; `npm run lint`, `npm run type-check` y `npm run build` correctos. La limpieza dejó 2 productos demo, 4 lotes y 4 movimientos.
- `/tienda` anónimo respondió 307 a `/login`; `/api/tienda/sesion` respondió 401. La interfaz local de login cargó y muestra el enlace Crear cuenta.
- A-01 a A-10 tienen evidencia de flujo local en `doc/ACEPTACION.md`; A-13 tiene confirmación de persistencia en PostgreSQL, no una prueba de cierre/reingreso en navegador. El panel de Vercel muestra “No Production Deployment” y requiere iniciar sesión para ver despliegues. Falta publicar el proyecto y repetir criterios e inspección visual en Vercel; no se modificaron datos productivos.

### P09 · Opcionales · 2026-11-14

- Implementados `lotesPorVencer()` y `reporteRotacion(desde, hasta)` en `lib/datos/`, reexportados por `dataService`; ambos usan SQL parametrizado y consultas de solo lectura.
- Añadidos `GET /api/tienda/vencimientos` y `GET /api/tienda/rotacion`; ambos exigen sesión. La ruta de rotación valida el rango inclusivo `desde`–`hasta`.
- Añadidas `/tienda/vencimientos` y `/tienda/rotacion`, con estados textuales, listas adaptables y selector de fechas.
- Verificación de solo lectura del demo (2026-11-14): `DEMO-LECHE` tiene 5 unidades por vencer el 2026-11-17 y 2 vencidas desde 2026-11-12. En el rango 2026-11-01–2026-11-14, `DEMO-ARROZ` y `DEMO-LECHE` registran 0 ventas; están empatados y el orden alfabético desempata. No se modificaron datos.
- El panel de Vercel indica que no hay despliegue de producción. Las pantallas autenticadas no pueden validarse visualmente allí hasta que el propietario publique la aplicación.
