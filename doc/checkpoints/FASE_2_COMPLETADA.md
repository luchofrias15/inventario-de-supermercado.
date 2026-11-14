# Fase 2 completada · Reglas de negocio

Se implementaron `PUNTO_REORDEN = 10`, `DIAS_AVISO_VENCIMIENTO = 5`, categorías y zona horaria, junto con reglas puras para fechas, vencimientos, inventario, FEFO, productos y entradas de lotes.

## Verificación

- Casos T-01 a T-26: todos pasan.
- Pruebas existentes conservadas: 8 pasan.
- `npm test`: 9 archivos, 34 pruebas, 0 fallas.
- `npm run type-check`: correcto.
- `npm run build`: correcto.

El build conserva una advertencia preexistente de Next.js por el acceso dinámico a archivos en `src/lib/json-db.ts`.
