import { conTransaccion } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';
import { validarEntrada } from '@/lib/reglas/lote';
import type { DatosEntrada } from './tipos';

interface ProductoEntradaDb {
  id: string;
  categoria: 'perecedero' | 'no_perecedero';
}

interface StockDb {
  stock: number;
}

export async function registrarEntrada(datos: DatosEntrada): Promise<{ stock: number }> {
  return conTransaccion(async (transaccion) => {
    const productos = await transaccion.query<ProductoEntradaDb>(
      `SELECT id, categoria
       FROM productos
       WHERE codigo = $1 AND activo = true
       FOR UPDATE`,
      [datos.codigo],
    );
    const producto = productos.rows[0];
    if (!producto) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');

    validarEntrada({
      cantidad: datos.cantidad,
      categoria: producto.categoria,
      fechaEntrada: datos.fechaEntrada,
      fechaVencimiento: datos.fechaVencimiento,
    });

    await transaccion.query(
      `INSERT INTO lotes (producto_id, cantidad, fecha_entrada, fecha_vencimiento)
       VALUES ($1, $2, $3, $4)`,
      [
        producto.id,
        datos.cantidad,
        datos.fechaEntrada,
        producto.categoria === 'perecedero' ? datos.fechaVencimiento : null,
      ],
    );
    await transaccion.query(
      `INSERT INTO movimientos (producto_id, tipo, cantidad, fecha)
       VALUES ($1, 'entrada', $2, $3)`,
      [producto.id, datos.cantidad, datos.fechaEntrada],
    );

    const stock = await transaccion.query<StockDb>(
      `SELECT COALESCE(SUM(cantidad), 0)::integer AS stock
       FROM lotes
       WHERE producto_id = $1
         AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= $2::date)`,
      [producto.id, hoyBogota()],
    );
    return { stock: stock.rows[0]?.stock ?? 0 };
  });
}
