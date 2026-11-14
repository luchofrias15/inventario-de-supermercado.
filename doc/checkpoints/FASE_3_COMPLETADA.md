# Fase 3 completada · Infraestructura del servidor

- Pool Postgres con `INVENTARIO_POSTGRES_URL`, parsers de fechas/ids y helper de transacciones.
- Adaptador de sesión que valida el token actual con Supabase Auth.
- Proxy de Next 16 bloquea solicitudes `/tienda/*` y `/api/tienda/*` sin cookie; las APIs devuelven 401 y las páginas redirigen a `/login`.
- `GET /api/tienda/sesion`, esquema de respuesta sin caché, lectura/validación Zod de cuerpos y filtros, y formato de fechas.
- El login existente se conserva y ahora navega a `/tienda`; `/` redirige según la sesión verificada.

## Verificación

- Sin sesión: `GET /tienda` → 307 a `/login`.
- Sin sesión: `GET /api/tienda/sesion` → 401 `NO_AUTORIZADO`.
- `npm test`: 34 pruebas correctas; `npm run type-check` y `npm run build` correctos.
- La validación interactiva de una sesión real se realizará cuando P06 cree la página `/tienda`; todavía no existe una pantalla de destino.
