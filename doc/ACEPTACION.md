# Aceptación del MVP

Ejecutar A-01 a A-10 y A-13 en el despliegue de Vercel. A-11 y A-12 son
opcionales y se verifican después de P09.

| ID | Acción | Resultado esperado | Resultado obtenido | Evidencia | Observación |
|---|---|---|---|---|---|
| A-01 | Abrir `/tienda` sin sesión | Redirección al login |  |  |  |
| A-02 | Crear "Leche" (perecedero) y "Arroz" (no perecedero) | Aparecen en el inventario |  |  |  |
| A-03 | Intentar otro producto con el mismo código | Rechazo por duplicado |  |  |  |
| A-04 | Registrar una entrada de Leche sin fecha de vencimiento | Rechazo (perecedero exige vencimiento) |  |  |  |
| A-05 | Registrar una entrada de Leche con vencimiento | El stock sube |  |  |  |
| A-06 | Registrar una entrada de Arroz sin vencimiento | Se permite (no perecedero) |  |  |  |
| A-07 | Vender una cantidad mayor al stock | Rechazo; el stock no cambia |  |  |  |
| A-08 | Vender una cantidad igual al stock | Se permite; queda en 0 |  |  |  |
| A-09 | Dejar un producto con stock ≤ 10 | Aparece en "para reordenar" |  |  |  |
| A-10 | Consultar el inventario completo | Tabla con todos y su stock |  |  |  |
| A-11 | (Opcional) Ver lotes por vencer y vencidos | Lista los próximos a vencer y los vencidos |  |  |  |
| A-12 | (Opcional) Ver el reporte de rotación | Productos ordenados por unidades vendidas |  |  |  |
| A-13 | Cerrar el navegador y volver a entrar | Los datos persisten |  |  |  |

Los resultados y la evidencia deben completarse al ejecutar la aceptación en
Vercel; no se marcan como aprobados por las pruebas locales.
