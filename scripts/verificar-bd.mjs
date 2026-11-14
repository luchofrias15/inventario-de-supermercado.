import { pool } from './conexion.mjs';

let failures = 0;

function report(label, success, detail = '') {
  console.log(`${success ? 'OK' : 'FALLA'} ${label}${detail ? `: ${detail}` : ''}`);
  if (!success) failures += 1;
}

async function exists(name, kind) {
  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = $1 AND c.relkind = $2
     ) AS present`,
    [name, kind],
  );
  return result.rows[0].present;
}

async function checkSchema() {
  console.log('1. Tablas y vista');
  const objects = [
    ['stores', 'r'],
    ['productos', 'r'],
    ['lotes', 'r'],
    ['movimientos', 'r'],
    ['store_orders', 'r'],
    ['store_order_items', 'r'],
    ['v_productos', 'v'],
  ];
  let allPresent = true;
  for (const [name, kind] of objects) {
    const present = await exists(name, kind);
    report(`${kind === 'v' ? 'vista' : 'tabla'} ${name}`, present);
    allPresent &&= present;
  }

  if (!allPresent) return false;

  console.log('\n2. Filas');
  for (const table of [
    'stores',
    'productos',
    'lotes',
    'movimientos',
    'store_orders',
    'store_order_items',
    'v_productos',
  ]) {
    const result = await pool.query(`SELECT COUNT(*)::bigint AS total FROM public.${table}`);
    console.log(`   ${table}: ${result.rows[0].total}`);
  }

  console.log('\n3. Restricciones');
  const constraints = [
    ['productos', 'productos_store_codigo_unico', 'i'],
    ['productos', 'productos_categoria_valida', 'c'],
    ['productos', 'productos_precio_unitario_positivo', 'c'],
    ['store_orders', 'store_orders_payment_method_check', 'c'],
    ['store_orders', 'store_orders_status_check', 'c'],
    ['store_order_items', 'store_order_items_quantity_check', 'c'],
    ['lotes', 'lotes_cantidad_no_neg', 'c'],
    ['lotes', 'lotes_fechas_coherentes', 'c'],
    ['movimientos', 'mov_cantidad_positiva', 'c'],
  ];
  for (const [table, name, type] of constraints) {
    const result = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM pg_class idx
         JOIN pg_namespace n ON n.oid = idx.relnamespace
         WHERE n.nspname = 'public' AND idx.relname = $2
           AND idx.relkind = 'i' AND $3 = 'i'
         UNION ALL
         SELECT 1
         FROM pg_constraint c
         JOIN pg_class tbl ON tbl.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = tbl.relnamespace
         WHERE n.nspname = 'public' AND tbl.relname = $1
           AND c.conname = $2 AND c.contype = $3
       ) AS present`,
      [table, name, type],
    );
    report(`${table}.${name}`, result.rows[0].present);
  }

  console.log('\n4. Row Level Security');
  const rls = await pool.query(
    `SELECT c.relname, c.relrowsecurity
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])`,
    [['stores', 'productos', 'lotes', 'movimientos', 'store_orders', 'store_order_items']],
  );
  for (const table of [
    'stores',
    'productos',
    'lotes',
    'movimientos',
    'store_orders',
    'store_order_items',
  ]) {
    const row = rls.rows.find((item) => item.relname === table);
    report(`${table} RLS activo`, row?.relrowsecurity === true);
  }
  return true;
}

async function expectConstraint(client, label, query, values, expectedCode, expectedConstraint) {
  await client.query('SAVEPOINT prueba_integridad');
  let caught;
  try {
    await client.query(query, values);
  } catch (error) {
    caught = error;
  }
  await client.query('ROLLBACK TO SAVEPOINT prueba_integridad');
  await client.query('RELEASE SAVEPOINT prueba_integridad');
  report(
    label,
    caught?.code === expectedCode &&
      (!expectedConstraint || caught.constraint === expectedConstraint),
    caught
      ? `código ${caught.code}, restricción ${caught.constraint ?? 'sin nombre'}`
      : 'la inserción inválida fue aceptada',
  );
}

async function checkIntegrity() {
  console.log('\n5. Integridad transaccional (rollback garantizado)');
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const defaultStore = await client.query(
      'SELECT id FROM public.stores WHERE is_default = true',
    );
    const storeId = defaultStore.rows[0]?.id;
    if (!storeId) throw new Error('No existe una tienda predeterminada.');

    const created = await client.query(
      `INSERT INTO productos (codigo, nombre, categoria, store_id)
       VALUES ('TD-A', 'Producto prueba P01', 'perecedero', $1)
       RETURNING id`,
      [storeId],
    );
    report('a) crear TD-A', true);
    const productId = created.rows[0].id;

    await expectConstraint(
      client,
      'a) código duplicado devuelve 23505 productos_store_codigo_unico',
      `INSERT INTO productos (codigo, nombre, categoria, store_id)
       VALUES ('TD-A', 'Duplicado prueba P01', 'perecedero', $1)`,
      [storeId],
      '23505',
      'productos_store_codigo_unico',
    );
    await expectConstraint(
      client,
      'b) categoría inválida devuelve 23514 productos_categoria_valida',
      `INSERT INTO productos (codigo, nombre, categoria, store_id)
       VALUES ('TD-B', 'Categoría inválida P01', 'otra', $1)`,
      [storeId],
      '23514',
      'productos_categoria_valida',
    );
    await expectConstraint(
      client,
      'c) cantidad negativa devuelve 23514 lotes_cantidad_no_neg',
      `INSERT INTO lotes (producto_id, cantidad, fecha_entrada)
       VALUES ($1, -1, CURRENT_DATE)`,
      [productId],
      '23514',
      'lotes_cantidad_no_neg',
    );
    await expectConstraint(
      client,
      'd) fechas incoherentes devuelven 23514 lotes_fechas_coherentes',
      `INSERT INTO lotes (producto_id, cantidad, fecha_entrada, fecha_vencimiento)
       VALUES ($1, 1, CURRENT_DATE, CURRENT_DATE - 1)`,
      [productId],
      '23514',
      'lotes_fechas_coherentes',
    );
    await expectConstraint(
      client,
      'e) cantidad cero devuelve 23514 mov_cantidad_positiva',
      `INSERT INTO movimientos (producto_id, tipo, cantidad, fecha)
       VALUES ($1, 'salida', 0, CURRENT_DATE)`,
      [productId],
      '23514',
      'mov_cantidad_positiva',
    );

    await client.query(
      `INSERT INTO lotes (producto_id, cantidad, fecha_entrada, fecha_vencimiento)
       VALUES
         ($1, 3, CURRENT_DATE, CURRENT_DATE + 2),
         ($1, 4, CURRENT_DATE, CURRENT_DATE + 10)`,
      [productId],
    );
    const unexpired = await client.query(
      `SELECT stock_disponible::integer AS disponible, stock_total::integer AS total
       FROM v_productos WHERE id = $1`,
      [productId],
    );
    report(
      'f) la vista suma ambos lotes no vencidos',
      unexpired.rows[0]?.disponible === 7 && unexpired.rows[0]?.total === 7,
      `disponible ${unexpired.rows[0]?.disponible}, total ${unexpired.rows[0]?.total}`,
    );

    await client.query(
      `INSERT INTO lotes (producto_id, cantidad, fecha_entrada, fecha_vencimiento)
       VALUES ($1, 4, CURRENT_DATE - 3, CURRENT_DATE - 1)`,
      [productId],
    );
    const withExpired = await client.query(
      `SELECT stock_disponible::integer AS disponible, stock_total::integer AS total
       FROM v_productos WHERE id = $1`,
      [productId],
    );
    report(
      'g) lote vencido excluido de disponible e incluido en total',
      withExpired.rows[0]?.disponible === 7 && withExpired.rows[0]?.total === 11,
      `disponible ${withExpired.rows[0]?.disponible}, total ${withExpired.rows[0]?.total}`,
    );
  } finally {
    if (transactionStarted) await client.query('ROLLBACK');
    client.release();
    console.log('   Transacción revertida (ROLLBACK).');
  }
}

try {
  const schemaPresent = await checkSchema();
  if (schemaPresent) await checkIntegrity();
  else report('pruebas de integridad', false, 'no se ejecutaron porque falta el esquema');
} catch (error) {
  console.error('Error al verificar la base de datos:', error);
  failures += 1;
} finally {
  await pool.end();
}

console.log(`\nTotal de fallas: ${failures}`);
if (failures > 0) process.exitCode = 1;
