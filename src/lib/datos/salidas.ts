import { conTransaccion } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hayStockSuficiente, descontarPorFefo, validarCantidad } from '@/lib/reglas/inventario';
import { hoyBogota } from '@/lib/reglas/fechas';
import { paraReordenar } from '@/lib/reglas/alertas';
import type { ResultadoSalida } from './tipos';

interface ProductoSalidaDb {
  id: string;
  punto_reorden: number;
}

interface LoteSalidaDb {
  id: number;
  cantidad: number;
}

export async function registrarSalida(
  codigo: string,
  cantidad: number,
  storeId: string,
): Promise<ResultadoSalida> {
  validarCantidad(cantidad);
  return conTransaccion(async (transaccion) => {
    const productos = await transaccion.query<ProductoSalidaDb>(
      `SELECT id, punto_reorden
       FROM productos
       WHERE codigo = $1 AND store_id = $2 AND activo = true
       FOR UPDATE`,
      [codigo, storeId],
    );
    const producto = productos.rows[0];
    if (!producto) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');

    const lotes = await transaccion.query<LoteSalidaDb>(
      `SELECT id, cantidad
       FROM lotes
       WHERE producto_id = $1
         AND cantidad > 0
         AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= $2::date)
       ORDER BY fecha_vencimiento ASC NULLS LAST, fecha_entrada ASC, id ASC
       FOR UPDATE`,
      [producto.id, hoyBogota()],
    );
    const disponible = lotes.rows.reduce((total, lote) => total + lote.cantidad, 0);
    if (!hayStockSuficiente(disponible, cantidad)) {
      throw new ErrorDeNegocio('STOCK_INSUFICIENTE', undefined, { disponible });
    }

    const descuentos = descontarPorFefo(lotes.rows, cantidad);
    for (const descuento of descuentos) {
      const resultado = await transaccion.query(
        `UPDATE lotes
         SET cantidad = cantidad - $2
         WHERE id = $1 AND cantidad >= $2`,
        [descuento.loteId, descuento.descuento],
      );
      if (resultado.rowCount !== 1) {
        throw new Error('Un lote cambió durante una venta bloqueada.');
      }
    }

    await transaccion.query(
      `INSERT INTO movimientos (producto_id, tipo, cantidad, fecha)
       VALUES ($1, 'salida', $2, $3)`,
      [producto.id, cantidad, hoyBogota()],
    );

    const stock = disponible - cantidad;
    return {
      stock,
      paraReordenar: paraReordenar(stock, producto.punto_reorden),
    };
  });
}
