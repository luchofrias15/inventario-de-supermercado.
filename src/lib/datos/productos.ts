import { consultar } from '@/lib/db/conexion';
import { DIAS_AVISO_VENCIMIENTO, LIMITE_LISTADO } from '@/lib/config/tienda';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { paraReordenar } from '@/lib/reglas/alertas';
import { estadoVencimiento } from '@/lib/reglas/vencimiento';
import { hoyBogota } from '@/lib/reglas/fechas';
import { validarProducto } from '@/lib/reglas/producto';
import type {
  DatosProducto,
  DetalleProducto,
  FilaInventario,
  Lote,
  Movimiento,
} from './tipos';

interface ProductoDb {
  id: string;
  codigo: string;
  nombre: string;
  categoria: FilaInventario['categoria'];
  precio_unitario: number | string | null;
  proveedor: string | null;
  punto_reorden: number;
  activo: boolean;
  stock_hoy: number;
}

interface LoteDb {
  id: number;
  cantidad: number;
  fecha_entrada: string;
  fecha_vencimiento: string | null;
}

interface MovimientoDb {
  id: number;
  tipo: Movimiento['tipo'];
  cantidad: number;
  fecha: string;
}

export async function obtenerTiendaPredeterminada(): Promise<string> {
  const [tienda] = await consultar<{ id: string }>(
    'SELECT id FROM stores WHERE is_default = true',
  );
  if (!tienda) throw new Error('No existe una tienda predeterminada; aplica las migraciones de roles y tiendas.');
  return tienda.id;
}

function esErrorPostgres(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function mapearInventario(producto: ProductoDb): FilaInventario {
  return {
    id: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    categoria: producto.categoria,
    precioUnitario: producto.precio_unitario === null
      ? null
      : Number(producto.precio_unitario),
    proveedor: producto.proveedor,
    puntoReorden: producto.punto_reorden,
    stockDisponible: producto.stock_hoy,
    paraReordenar: paraReordenar(producto.stock_hoy, producto.punto_reorden),
  };
}

const STOCK_HOY_SQL = `COALESCE((
  SELECT SUM(l.cantidad)
  FROM lotes l
  WHERE l.producto_id = v.id
    AND (l.fecha_vencimiento IS NULL OR l.fecha_vencimiento >= $1::date)
), 0)::integer`;

export async function listarInventario(filtros: {
  soloReorden?: boolean;
  busqueda?: string;
} = {}, storeId?: string): Promise<FilaInventario[]> {
  const hoy = hoyBogota();
  const valores: unknown[] = [hoy];
  const condiciones = ['v.activo = true'];

  if (storeId) {
    valores.push(storeId);
    condiciones.push(`v.store_id = $${valores.length}`);
  }

  if (filtros.soloReorden) {
    condiciones.push(`${STOCK_HOY_SQL} <= v.punto_reorden`);
  }
  if (filtros.busqueda) {
    valores.push(`%${filtros.busqueda}%`);
    condiciones.push(`(v.codigo ILIKE $${valores.length} OR v.nombre ILIKE $${valores.length})`);
  }

  const productos = await consultar<ProductoDb>(
    `SELECT v.id, v.codigo, v.nombre, v.categoria, v.precio_unitario, v.proveedor,
            v.punto_reorden, v.activo, ${STOCK_HOY_SQL} AS stock_hoy
     FROM v_productos v
     WHERE ${condiciones.join(' AND ')}
     ORDER BY v.nombre ASC
     LIMIT ${LIMITE_LISTADO}`,
    valores,
  );
  return productos.map(mapearInventario);
}

export async function crearProducto(
  datos: DatosProducto,
  storeId: string,
): Promise<{ id: string; codigo: string }> {
  validarProducto(datos);
  try {
    const [producto] = await consultar<{ id: string; codigo: string }>(
      `INSERT INTO productos (codigo, nombre, categoria, precio_unitario, proveedor, store_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, codigo`,
      [
        datos.codigo.trim(),
        datos.nombre.trim(),
        datos.categoria,
        datos.precioUnitario,
        datos.proveedor?.trim() || null,
        storeId,
      ],
    );
    if (!producto) throw new Error('La base de datos no devolvió el producto creado.');
    return producto;
  } catch (error) {
    if (esErrorPostgres(error) && error.code === '23505') {
      throw new ErrorDeNegocio('PRODUCTO_DUPLICADO');
    }
    throw error;
  }
}

export async function obtenerProducto(codigo: string, storeId?: string): Promise<DetalleProducto> {
  const hoy = hoyBogota();
  const storeCondition = storeId ? 'AND v.store_id = $3' : '';
  const [producto] = await consultar<ProductoDb>(
    `SELECT v.id, v.codigo, v.nombre, v.categoria, v.precio_unitario, v.proveedor,
            v.punto_reorden, p.activo, ${STOCK_HOY_SQL} AS stock_hoy
     FROM v_productos v
     JOIN productos p ON p.id = v.id
     WHERE v.codigo = $2 ${storeCondition}`,
    storeId ? [hoy, codigo, storeId] : [hoy, codigo],
  );
  if (!producto) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');

  const [lotes, movimientos] = await Promise.all([
    consultar<LoteDb>(
      `SELECT id, cantidad, fecha_entrada, fecha_vencimiento
       FROM lotes
       WHERE producto_id = $1
       ORDER BY fecha_entrada DESC, id DESC`,
      [producto.id],
    ),
    consultar<MovimientoDb>(
      `SELECT id, tipo, cantidad, fecha
       FROM movimientos
       WHERE producto_id = $1
       ORDER BY fecha DESC, id DESC
       LIMIT 20`,
      [producto.id],
    ),
  ]);

  const fila = mapearInventario(producto);
  const detalleLotes: Lote[] = lotes.map((lote) => ({
    id: lote.id,
    cantidad: lote.cantidad,
    fechaEntrada: lote.fecha_entrada,
    fechaVencimiento: lote.fecha_vencimiento,
    estadoVencimiento: lote.fecha_vencimiento
      ? estadoVencimiento(lote.fecha_vencimiento, hoy, DIAS_AVISO_VENCIMIENTO)
      : null,
  }));
  return {
    ...fila,
    activo: producto.activo,
    lotes: detalleLotes,
    movimientos: movimientos.map((movimiento) => ({
      id: movimiento.id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      fecha: movimiento.fecha,
    })),
  };
}

export async function desactivarProducto(codigo: string, storeId: string): Promise<void> {
  const productos = await consultar<{ id: string }>(
    `UPDATE productos
     SET activo = false
     WHERE codigo = $1 AND store_id = $2 AND activo = true
     RETURNING id`,
    [codigo, storeId],
  );
  if (productos.length === 0) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
}

export async function productosParaReordenar(storeId?: string): Promise<FilaInventario[]> {
  return listarInventario({ soloReorden: true }, storeId);
}
