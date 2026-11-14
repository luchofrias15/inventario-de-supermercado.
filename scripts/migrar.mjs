import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './conexion.mjs';

const migrationsDirectory = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
const migrations = (await readdir(migrationsDirectory))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();

if (migrations.length === 0) {
  throw new Error('No se encontraron archivos de migración en supabase/migrations/.');
}

try {
  for (const migration of migrations) {
    const sql = await readFile(path.join(migrationsDirectory, migration), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`OK ${migration}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Falló la migración ${migration}.`, { cause: error });
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
