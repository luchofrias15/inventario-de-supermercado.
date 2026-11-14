import { pool } from './conexion.mjs';

const patrones = process.argv.includes('--prueba')
  ? ['TD-TEST-%', 'PRUEBA-%']
  : ['DEMO-%'];

const cliente = await pool.connect();
try {
  await cliente.query('BEGIN');
  const movimientos = await cliente.query(
    `DELETE FROM movimientos
     WHERE producto_id IN (
       SELECT id FROM productos WHERE codigo LIKE ANY($1::text[])
     )
     RETURNING id`,
    [patrones],
  );
  const lotes = await cliente.query(
    `DELETE FROM lotes
     WHERE producto_id IN (
       SELECT id FROM productos WHERE codigo LIKE ANY($1::text[])
     )
     RETURNING id`,
    [patrones],
  );
  const productos = await cliente.query(
    `DELETE FROM productos
     WHERE codigo LIKE ANY($1::text[])
     RETURNING id`,
    [patrones],
  );
  await cliente.query('COMMIT');
  console.log(
    `Limpieza completada: ${productos.rowCount} productos, ${lotes.rowCount} lotes, ${movimientos.rowCount} movimientos.`,
  );
} catch (error) {
  await cliente.query('ROLLBACK');
  throw error;
} finally {
  cliente.release();
  await pool.end();
}
