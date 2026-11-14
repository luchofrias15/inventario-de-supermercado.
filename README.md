# Inventario de Tienda

MVP de inventario para una tienda, construido con Next.js, TypeScript, Supabase
Auth y PostgreSQL. Administra productos, entradas por lote, ventas y alertas.

## Funcionalidades

- Inventario protegido por inicio de sesión.
- Productos perecederos y no perecederos, entradas, lotes y movimientos.
- Stock disponible derivado de los lotes vigentes, no de un campo editable.
- Ventas transaccionales con FEFO (se descuenta primero el lote que vence antes).
- Alertas de reorden cuando el stock disponible es 10 unidades o menos.
- Validación de vencimiento: los lotes perecederos requieren fecha; los lotes
  vencidos no se venden y los que vencen dentro de 5 días se identifican como
  próximos a vencer.

## Requisitos

- Node.js 22 LTS y npm.
- Un proyecto Supabase con Auth configurado y la URL de conexión PostgreSQL
  del pooler disponible.

## Ejecutar en local

Instala dependencias:

```bash
npm install
```

Crea `.env.local` en la raíz y configura estas variables (no compartas ni
versiones sus valores):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
INVENTARIO_POSTGRES_URL=
```

Aplica las migraciones, carga los datos de demostración y ejecuta la aplicación:

```bash
npm run db:migrar
npm run db:verificar
npm run db:demo
npm run dev
```

Abre `http://localhost:3000/login`. Para verificar el módulo desde el navegador,
inicia sesión con un usuario de Supabase Auth.

## Autenticación y datos

El inicio de sesión usa Supabase Auth; los perfiles y roles de usuario se
mantienen en `public.profiles` (consulta [supabase/README.md](./supabase/README.md)).
Las rutas de `/api/tienda` requieren una sesión válida. `/api/health` es público.

El antiguo endpoint `/api/data/[collection]` se conserva para compatibilidad,
pero también requiere autenticación y usa el almacenamiento JSON local; la
interfaz actual de `/tienda` usa PostgreSQL.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run type-check` | Verificación de TypeScript |
| `npm test` | Pruebas unitarias |
| `npm run db:migrar` | Aplica migraciones pendientes |
| `npm run db:verificar` | Verifica tablas, restricciones y RLS |
| `npm run db:demo` | Carga productos y lotes de demostración |
| `npm run db:limpiar -- --prueba` | Elimina registros de prueba y conserva los demos |
| `npm run probar:flujo` | Ejecuta el flujo de inventario contra PostgreSQL |

Consulta el [plan funcional y técnico](./doc/PLAN%20TIENDA.md) para reglas,
flujos, criterios de aceptación y detalles de implementación.
