import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());

const connectionString = process.env.INVENTARIO_POSTGRES_URL;
if (!connectionString) {
  throw new Error('Falta la variable INVENTARIO_POSTGRES_URL en el entorno o en .env.local.');
}

const url = new URL(connectionString);
url.searchParams.delete('sslmode');

export const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
  max: 1,
});
