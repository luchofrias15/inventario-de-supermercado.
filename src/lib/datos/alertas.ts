import { consultar } from '@/lib/db/conexion';
import { DIAS_AVISO_VENCIMIENTO, LIMITE_LISTADO } from '@/lib/config/tienda';
import { estadoVencimiento, type EstadoVencimiento } from '@/lib/reglas/vencimiento';
import { hoyBogota } from '@/lib/reglas/fechas';
import type { FilaLoteVencimiento } from './tipos';

interface LoteAlertaDb {
  id: number;
  cantidad: number;
  fecha_entrada: string;
  fecha_vencimiento: string;
  codigo: string;
  nombre: string;
}

export async function lotesPorVencer(): Promise<FilaLoteVencimiento[]> {
  const hoy = hoyBogota();
  const lotes = await consultar<LoteAlertaDb>(
    `SELECT l.id, l.cantidad, l.fecha_entrada, l.fecha_vencimiento,
            p.codigo, p.nombre
     FROM lotes l
     JOIN productos p ON p.id = l.producto_id
     WHERE l.cantidad > 0
       AND l.fecha_vencimiento IS NOT NULL
       AND l.fecha_vencimiento <= $1::date + $2::integer
     ORDER BY l.fecha_vencimiento ASC, p.nombre ASC, l.id ASC
     LIMIT ${LIMITE_LISTADO}`,
    [hoy, DIAS_AVISO_VENCIMIENTO],
  );

  return lotes.flatMap((lote): FilaLoteVencimiento[] => {
    const estado: EstadoVencimiento = estadoVencimiento(
      lote.fecha_vencimiento,
      hoy,
      DIAS_AVISO_VENCIMIENTO,
    );
    if (estado === 'vigente') return [];
    if (estado !== 'por_vencer' && estado !== 'vencido') return [];
    return [{
      id: lote.id,
      cantidad: lote.cantidad,
      fechaEntrada: lote.fecha_entrada,
      fechaVencimiento: lote.fecha_vencimiento,
      estadoVencimiento: estado,
      codigo: lote.codigo,
      nombre: lote.nombre,
    }];
  });
}