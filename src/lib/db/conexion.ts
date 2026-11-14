import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';

types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1114, (valor) => valor);
types.setTypeParser(1184, (valor) => valor);
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));

type PoolGlobal = typeof globalThis & { poolTienda?: Pool };

function obtenerCadenaConexion(): string {
  const cadena = process.env.INVENTARIO_POSTGRES_URL;
  if (!cadena) {
    throw new Error('Falta configurar la variable INVENTARIO_POSTGRES_URL.');
  }

  try {
    const url = new URL(cadena);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch (error) {
    throw new Error('La variable INVENTARIO_POSTGRES_URL no contiene una URL válida.', {
      cause: error,
    });
  }
}

const globalParaPool = globalThis as PoolGlobal;

export const pool =
  globalParaPool.poolTienda ??
  new Pool({
    connectionString: obtenerCadenaConexion(),
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') globalParaPool.poolTienda = pool;

export async function consultar<T extends QueryResultRow>(
  sql: string,
  valores: readonly unknown[] = [],
): Promise<T[]> {
  const resultado = await pool.query<T>(sql, [...valores]);
  return resultado.rows;
}

export async function conTransaccion<T>(
  trabajo: (transaccion: PoolClient) => Promise<T>,
): Promise<T> {
  const transaccion = await pool.connect();
  let iniciada = false;
  try {
    await transaccion.query('BEGIN');
    iniciada = true;
    const resultado = await trabajo(transaccion);
    await transaccion.query('COMMIT');
    iniciada = false;
    return resultado;
  } catch (error) {
    if (iniciada) {
      try {
        await transaccion.query('ROLLBACK');
      } catch (errorRollback) {
        throw new AggregateError(
          [error, errorRollback],
          'Falló la operación y también el rollback de la transacción.',
        );
      }
    }
    throw error;
  } finally {
    transaccion.release();
  }
}

export async function cerrarPool(): Promise<void> {
  await pool.end();
}
