# Fase 4 completada · Datos y API

## Datos y flujo

- `src/lib/datos/` usa SQL parametrizado y `src/lib/dataService.ts` como fachada.
- Entradas crean lotes y movimientos en una transacción; ventas bloquean los lotes vendibles, descuentan por FEFO y registran el movimiento atómicamente.
- `db:demo` cargó los registros `DEMO-LECHE` y `DEMO-ARROZ`, con dos lotes vigentes, uno vencido y existencias bajas para reordenar.
- `probar:flujo`: 14 escenarios correctos, 0 fallas. Los registros `TD-TEST-*` se borraron al finalizar; se conservaron los demos.
- El paso 8 del plan se corrigió para respetar RN-01: stock 8 sí activa la alerta `<= 10`.

## Base de datos

`db:verificar` confirmó tablas/vista, restricciones y RLS; integridad a–g correcta, rollback aplicado y 0 fallas. Con los datos demo quedaron 2 productos, 4 lotes y 4 movimientos.

## Validación de código

- `npm test`: 34 pruebas correctas.
- `npm run type-check`: correcto.
- `npm run build`: correcto, con una advertencia preexistente de tracing de filesystem en el almacenamiento JSON.

La fase 4 sigue abierta hasta completar P05 (rutas API protegidas y verificación autenticada).
