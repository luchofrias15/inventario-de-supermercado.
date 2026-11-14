# Fase 1 completada · Base de datos

## Migraciones aplicadas

- `20261003120000_create_profiles.sql` (migración existente, aplicada de forma idempotente).
- M1: `20261114090000_tienda_tablas.sql`.
- M2: `20261114090100_tienda_vista_seguridad.sql`.

## Resultado de `npm run db:verificar`

- Tablas `productos`, `lotes`, `movimientos` y vista `v_productos`: presentes.
- Filas: productos 0, lotes 0, movimientos 0, vista 0.
- Restricciones `productos_codigo_unico`, `productos_categoria_valida`, `lotes_cantidad_no_neg`, `lotes_fechas_coherentes`, `mov_cantidad_positiva`: todas presentes.
- RLS: activo en las tres tablas.
- Casos de integridad en transacción: inserción válida; duplicado 23505; categoría inválida 23514; cantidad negativa 23514; fechas incoherentes 23514; cantidad cero 23514; suma de lotes no vencidos correcta; lote vencido excluido del stock disponible.
- La transacción de verificación terminó con `ROLLBACK`.
- **Total de fallas: 0.**

`npm run build`: correcto. Permanece la advertencia de tracing de filesystem en el almacenamiento JSON preexistente.
