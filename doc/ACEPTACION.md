# Aceptación del MVP

Ejecutar A-01 a A-10 y A-13 en el despliegue de Vercel. A-11 y A-12 son
opcionales y se verifican después de P09. Los resultados locales de abajo no
sustituyen la aceptación en Vercel.

| ID | Acción | Resultado esperado | Resultado obtenido | Evidencia | Observación |
|---|---|---|---|---|---|
| A-01 | Abrir `/tienda` sin sesión | Redirección al login | Validado localmente: HTTP 307 hacia `/login`; Vercel pendiente | `curl` local, 2026-11-14 | El endpoint de sesión anónimo respondió 401 |
| A-02 | Crear "Leche" (perecedero) y "Arroz" (no perecedero) | Aparecen en el inventario | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenarios 1, 3 y 8 | Datos de prueba limpiados al terminar |
| A-03 | Intentar otro producto con el mismo código | Rechazo por duplicado | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenario 2 | Código `PRODUCTO_DUPLICADO` |
| A-04 | Registrar una entrada de Leche sin fecha de vencimiento | Rechazo (perecedero exige vencimiento) | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenario 4 | Código `DATOS_INVALIDOS` |
| A-05 | Registrar una entrada de Leche con vencimiento | El stock sube | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenarios 5 y 6 | Stock pasa a 8 y luego 13 |
| A-06 | Registrar una entrada de Arroz sin vencimiento | Se permite (no perecedero) | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenario 7 |  |
| A-07 | Vender una cantidad mayor al stock | Rechazo; el stock no cambia | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenario 10 | Código `STOCK_INSUFICIENTE`; stock se conserva |
| A-08 | Vender una cantidad igual al stock | Se permite; queda en 0 | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenario 11 |  |
| A-09 | Dejar un producto con stock ≤ 10 | Aparece en "para reordenar" | Validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenarios 8, 9 y 13 | Umbral inclusivo |
| A-10 | Consultar el inventario completo | Tabla con todos y su stock | Consulta/listado validado por flujo automatizado local; Vercel pendiente | `npm run probar:flujo`, escenarios 8 y 13 | Inspección visual autenticada pendiente |
| A-11 | (Opcional) Ver lotes por vencer y vencidos | Lista los próximos a vencer y los vencidos | Validado en consulta local con datos demo; interfaz autenticada pendiente | `lotesPorVencer()` sobre PostgreSQL, 2026-11-14 | DEMO-LECHE: 5 unidades vencen 2026-11-17 (por vencer) y 2 vencieron 2026-11-12 (vencido) |
| A-12 | (Opcional) Ver el reporte de rotación | Productos ordenados por unidades vendidas | Validado en consulta local con datos demo; interfaz autenticada pendiente | `reporteRotacion(2026-11-01, 2026-11-14)` sobre PostgreSQL, 2026-11-14 | DEMO-ARROZ y DEMO-LECHE tienen 0 ventas; empate en cero, orden alfabético y sin producto más vendido |
| A-13 | Cerrar el navegador y volver a entrar | Los datos persisten | Persistencia de PostgreSQL comprobada; ciclo de navegador/Vercel pendiente | `npm run db:verificar`: 2 productos demo y sus lotes/movimientos persisten | No se realizó la prueba de cierre/reingreso en Vercel |

Pruebas locales ejecutadas el 2026-11-14: `npm test` (38 pruebas), `npm run
probar:flujo` (14 escenarios, 0 fallas), `npm run db:verificar` (0 fallas),
`npm run lint`, `npm run type-check` y `npm run build` correctos.

La aceptación remota sigue pendiente. El panel del proyecto Vercel mostró
“No Production Deployment” y pidió iniciar sesión para ver los despliegues; por
tanto, no hay una URL pública de producción que se pueda probar desde aquí.
No se modificaron datos de un despliegue productivo. Las opciones de P09
quedaron verificadas contra PostgreSQL en modo de solo lectura; el demo no
contiene ventas, así que no hay un producto más vendido en A-12.
