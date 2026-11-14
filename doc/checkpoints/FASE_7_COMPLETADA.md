# Fase 7 completada · Funcionalidades opcionales

## Vencimientos

- `lotesPorVencer()` consulta lotes con cantidad disponible y fecha de
  vencimiento, calcula el estado con `hoyBogota()` y limita los resultados a
  lotes vencidos o que vencen dentro de los próximos cinco días.
- `GET /api/tienda/vencimientos` requiere sesión.
- `/tienda/vencimientos` muestra por separado los lotes por vencer y vencidos,
  con código, nombre, unidades, fecha y estado textual.
- Verificación local de solo lectura el 2026-11-14: `DEMO-LECHE` tiene 5
  unidades que vencen el 2026-11-17 y 2 unidades vencidas desde 2026-11-12.

## Rotación

- `reporteRotacion(desde, hasta)` agrega unidades de movimientos de salida en
  un rango inclusivo, incluye productos sin ventas y ordena de mayor a menor
  (con nombre como desempate estable).
- `GET /api/tienda/rotacion` requiere sesión y valida las fechas.
- `/tienda/rotacion` permite seleccionar el rango y presenta una tabla
  adaptable con unidades vendidas.
- Verificación local de solo lectura para 2026-11-01–2026-11-14: los dos
  productos demo registran 0 ventas; quedan empatados en cero y no hay un
  producto más vendido que pueda verificarse con esos datos.

## Validación

- Pruebas específicas: 7 para alertas, reporte y protección/validación de rutas.
- Suite completa: `npm test` con 45 pruebas; `npm run lint`,
  `npm run type-check` y `npm run build` correctos.
- El build conserva la advertencia preexistente de tracing amplio desde
  `src/lib/json-db.ts`, usado por el endpoint JSON legado.
- No se escribieron ni limpiaron datos de inventario durante la verificación.
- La aceptación visual autenticada y el despliegue de producción siguen
  pendientes: el panel Vercel muestra “No Production Deployment”.
