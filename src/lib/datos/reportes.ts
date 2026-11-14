import { consultar } from '@/lib/db/conexion';
import { LIMITE_LISTADO } from '@/lib/config/tienda';
import type { FilaRotacion } from './tipos';

interface FilaRotacionDb {
  codigo: string;
  nombre: string;
  unidades_vendidas: number;
}

export async function reporteRotacion(desde: string, hasta: string): Promise<FilaRotacion[]> {
  const filas = await consultar<FilaRotacionDb>(
    `SELECT p.codigo, p.nombre,
            COALESCE(SUM(m.cantidad), 0)::integer AS unidades_vendidas
     FROM productos p
     LEFT JOIN movimientos m
       ON m.producto_id = p.id
      AND m.tipo = 'salida'
      AND m.fecha >= $1::date
      AND m.fecha <= $2::date
     GROUP BY p.id, p.codigo, p.nombre
     ORDER BY unidades_vendidas DESC, p.nombre ASC
     LIMIT ${LIMITE_LISTADO}`,
    [desde, hasta],
  );

  return filas.map((fila) => ({
    codigo: fila.codigo,
    nombre: fila.nombre,
    unidadesVendidas: fila.unidades_vendidas,
  }));
}