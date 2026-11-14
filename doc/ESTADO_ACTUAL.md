# Estado actual del repositorio

Auditoría P00 del repositorio `inventario-de-supermercado`. La documentación del plan y los prompts se encuentra actualmente en `doc/PLAN TIENDA.md` y `doc/PROMPTS TIENDA.md` (con espacios); algunos prompts se refieren a los nombres `PLAN_TIENDA.md` y `PROMPTS_TIENDA.md` (con guiones bajos). No se renombraron los documentos.

## 1. Proyecto y compilación

Existe un proyecto Next.js con TypeScript:

- Next.js `16.3.5`
- React y React DOM `19.0.0`
- TypeScript `5.8.2`
- Tailwind CSS `4.0.12`

La aplicación usa App Router bajo `src/app/`. El proyecto y sus dependencias instaladas están presentes localmente. No se pudo comprobar la compilación: se intentó `npm run build`, pero PowerShell respondió que `npm` no se reconoce como comando. Tampoco se encontró `node.exe` ni `npm.cmd` en las ubicaciones comprobadas. La existencia de un despliegue activo en Vercel no se puede confirmar desde el repositorio.

## 2. Scripts de `package.json`

| Script | Comando |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |
| `type-check` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `format` | `prettier --write "src/**/*.{ts,tsx,css}"` |

## 3. Estructura existente

El proyecto usa `src/`. Árbol relevante (hasta tres niveles):

```text
src/
  app/
    api/
      auth/login, auth/logout, data/[collection], health
    dashboard/
    login/
    globals.css
    layout.tsx
    page.tsx
  components/
    inventory/InventoryDashboard.tsx
  lib/
    auth.ts
    json-db.ts
    json-db.test.ts
    supabase-config.ts
    types.ts
    utils.ts
  test/setup.ts
data/
  _schema/
  categories.json
  products.json
  users.json
supabase/
  migrations/20261003120000_create_profiles.sql
  README.md
```

No existe una carpeta raíz `scripts/`, ni `src/app/tienda/`, `src/app/api/tienda/`, `src/lib/dataService.ts` o `src/components/ui/`.

## 4. Dependencias relevantes

| Dependencia | Estado |
|---|---|
| `pg` | FALTA |
| `@types/pg` | FALTA |
| `zod` | Presente (`3.24.2`) |
| `@supabase/supabase-js` | FALTA; el login llama directamente a Supabase Auth con `fetch` |
| `vitest` | Presente (`3.0.8`) |

## 5. Autenticación

Hay un login en `src/app/login/page.tsx` y endpoints `src/app/api/auth/login/route.ts` y `src/app/api/auth/logout/route.ts`. El endpoint de login autentica correo y contraseña con Supabase Auth, consulta `public.profiles` y establece cookies HttpOnly de acceso y refresh. La interfaz redirige a `/dashboard` al iniciar sesión.

No se encontró un adaptador de sesión del servidor (`obtenerSesion`/`exigirSesion`) ni archivo `middleware.ts` o `proxy.ts` que proteja páginas o API. El dashboard y las rutas de datos no tienen la protección de sesión que requiere el plan. El login también devuelve un rol leído del perfil; el plan de tienda contempla una puerta única sin roles, por lo que habrá que adaptar la integración sin rehacer el login.

## 6. Variables de conexión a Postgres

`.env.local` contiene variables de conexión Postgres, y `.gitignore` excluye `.env` y `.env.local`. Solo se inspeccionaron nombres y puertos; no se copiaron ni registraron valores.

- `INVENTARIO_POSTGRES_URL`: puerto `6543` (pooler). Recomendado como variable de conexión para `pg`.
- `INVENTARIO_POSTGRES_PRISMA_URL`: puerto `6543` (pooler), variante de conexión para Prisma.
- `INVENTARIO_POSTGRES_URL_NON_POOLING`: puerto `5432` (conexión directa, no usar para el pool de la aplicación).

La variable exacta recomendada para `lib/db/conexion.ts` es `INVENTARIO_POSTGRES_URL`. No se comprobó que la conexión funcione ni que las variables locales y de Vercel estén sincronizadas. El documento del plan muestra `DATABASE_URL` como ejemplo, pero P00 indica usar el nombre real confirmado aquí.

## 7. Ubicación actual de los datos

Productos, categorías y usuarios de demostración residen en archivos JSON bajo `data/`. `src/lib/json-db.ts` lee y escribe esas colecciones; bloquea escrituras cuando `NODE_ENV` es `production`. Los productos actuales guardan stock directamente, a diferencia del modelo del plan, que deriva el stock de los lotes.

## 8. Migraciones

Existe `supabase/migrations/20261003120000_create_profiles.sql`, que crea perfiles vinculados a Supabase Auth, RLS y políticas de perfil. `supabase/README.md` documenta aplicar migraciones con `supabase db push` o el editor SQL de Supabase. No se encontró una configuración `supabase/config.toml`, script propio de migraciones ni evidencia local de que el proyecto Supabase esté enlazado.

La numeración recomendada para las migraciones del inventario es:

- M1: `20261114090000_tienda_tablas.sql`
- M2: `20261114090100_tienda_vista_seguridad.sql`

## 9. Estado del dominio

| Pieza | Estado observado |
|---|---|
| Catálogo básico de productos y categorías | Existe en JSON y API CRUD genérica; el modelo no coincide con el dominio de tienda y debe adaptarse. |
| Lotes | No existe. |
| Movimientos de entrada/salida | No existe. |
| Venta FEFO y transaccional | No existe. |
| Stock disponible derivado de lotes | No existe; hoy se guarda un campo `stock` en el producto. |
| Alertas de stock | Parciales: dashboard calcula `stock <= minStock`; no aplica el umbral fijo 10 ni usa stock de lotes. |
| Vencimientos | No existe. |
| Rotación | No existe. |

## 10. Estilos

Tailwind CSS 4 está instalado. `src/app/globals.css` importa `tailwindcss` y contiene estilos globales y de la página de inicio. No hay `tailwind.config`; los tokens de tienda deberán agregarse con `@theme` sin borrar los estilos existentes.

## 11. Pruebas

Vitest `3.0.8` está configurado con entorno `jsdom`, setup en `src/test/setup.ts` e inclusión de pruebas bajo `src/`. Hay pruebas para `src/lib/json-db.ts`, el login y el endpoint de salud. La configuración actual no usa el patrón `tests/**/*.test.ts` del plan; P02 debe adaptarla respetando la configuración existente.

## 12. Conflictos y piezas coincidentes

- No hay rutas `/tienda` ni `/api/tienda`.
- `src/app/page.tsx` es una página pública de presentación con enlaces a `/login` y `/dashboard`; no redirige a tienda.
- `src/app/dashboard/page.tsx` renderiza `InventoryDashboard`.
- No existe `dataService`, componentes `ui` ni tablas `productos`, `lotes` y `movimientos`.
- La única migración encontrada crea `profiles`.
- La API actual de `/api/data/[collection]` opera sobre colecciones JSON `products` y `categories`; no es el contrato del módulo de tienda.

## 13. Decisiones derivadas

| Decisión | Resultado |
|---|---|
| Base Next.js | Existe; no ejecutar P-INIT. |
| Login | Reutilizar `/login` y los endpoints de Supabase Auth; adaptar la sesión y destino en P03. |
| Protección de rutas | No existe; para Next 16 evaluar `src/proxy.ts` en P03 y proteger además cada API según el plan. |
| Migraciones | Mantener `supabase/migrations/` y adaptar el mecanismo documentado de Supabase CLI; confirmar enlace/proyecto al aplicar P01. |
| Conexión a Postgres | `INVENTARIO_POSTGRES_URL` (pooler, puerto 6543). |
| M1 / M2 | `20261114090000_tienda_tablas.sql` / `20261114090100_tienda_vista_seguridad.sql`. |
| Alias | `@/*` apunta a `src/*`; usar `@/lib/...` y `@/components/...`. |
| Ubicación de App Router | `src/app/`. |
| Nombres de documentos | Los archivos actuales usan espacios; revisar las referencias con guiones bajos en los prompts antes de ejecutar fases posteriores. |

## 14. Compilación de base

En la primera ejecución de P00, `npm run build` no pudo iniciar porque Node.js/npm no estaban disponibles. Después se instaló Node.js LTS 22.23.5 en el perfil del usuario. La compilación de P01 y P02 finalizó correctamente. Next informa una advertencia preexistente de trazado dinámico en `src/lib/json-db.ts`; no impide el build y no se cambió porque el archivo es ajeno al alcance de estas fases.
