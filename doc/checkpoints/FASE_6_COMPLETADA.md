# Fase 6 completada · Revisión y pruebas del MVP

## Revisión

- El stock disponible se calcula a partir de lotes no vencidos.
- Las ventas bloquean y descuentan lotes por FEFO dentro de una transacción; no
  pueden vender lotes vencidos ni dejar existencias negativas.
- Las reglas del servidor exigen fecha de vencimiento para perecederos y una
  cantidad positiva para entradas y salidas.
- Las rutas de inventario requieren una sesión válida de Supabase Auth.
- Las consultas de la capa de datos son parametrizadas.
- Las fechas de negocio se obtienen mediante `hoyBogota()` y los estados se
  comunican con texto e indicadores, no solo mediante color.
- La rotación de credenciales expuestas fue confirmada por el usuario; no se
  copiaron valores secretos a archivos versionados.

## Verificación local

- `npm test`: 9 archivos, 34 pruebas correctas.
- `npm run probar:flujo`: 14 escenarios correctos, 0 fallas; limpió solo los
  registros de prueba.
- `npm run db:verificar`: 0 fallas; demos conservados (2 productos, 4 lotes y
  4 movimientos).
- `npm run db:limpiar -- --prueba`: correcto; 0 registros de prueba restantes.
- `npm run type-check` y `npm run lint`: correctos.
- `npm run build`: correcto. Sigue la advertencia existente de tracing amplio
  desde `src/lib/json-db.ts`, usado por el endpoint JSON legado.
- Peticiones anónimas: `/tienda` redirige; `/api/tienda/sesion` y
  `/api/data/products` responden `401`.

La aceptación A-01 a A-10 y A-13 debe ejecutarse en Vercel y registrarse en
`doc/ACEPTACION.md`. La prueba autenticada/visual requiere la cuenta del usuario.
