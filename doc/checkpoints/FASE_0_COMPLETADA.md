# Fase 0 completada · Conciliación

- **Infraestructura:** existe un proyecto Next.js 16 con TypeScript, Tailwind 4, Vitest, login con Supabase Auth y variables locales de Postgres. No ejecutar P-INIT.
- **Conexión prevista:** `INVENTARIO_POSTGRES_URL`, pooler en el puerto 6543. La conectividad no está comprobada.
- **Dictamen:** el catálogo/dashboard actual usa JSON y guarda stock directamente. No existen lotes, movimientos, entradas, ventas FEFO, ni rutas del módulo de tienda; esas piezas deben adaptarse o crearse en P01–P08.
- **Seguridad:** el estudiante confirmó que rotó las credenciales que habían estado expuestas. No se copiaron secretos a la documentación.
- **Pendientes del estudiante:** disponer de Node.js/npm en el PATH y volver a ejecutar `npm run build`; confirmar Supabase remoto y que la variable del pooler está vigente antes de aplicar migraciones. Ver `doc/DICTAMEN.md`.
- **Incidencia de nombres:** el plan y los prompts tienen espacios en sus nombres actuales, mientras que algunos prompts los referencian con guiones bajos.

P00 está documentado. La verificación de compilación queda pendiente porque `npm` no está disponible en la terminal actual.
