import { ErrorDeNegocio } from './errores';

export type TipoMovimiento = 'entrada' | 'salida';

export interface LoteParaDescuento {
  id: number;
  cantidad: number;
}

export interface DescuentoLote {
  loteId: number;
  descuento: number;
}

export function validarCantidad(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}

export function hayStockSuficiente(disponible: number, cantidad: number): boolean {
  return cantidad <= disponible;
}

export function descontarPorFefo(
  lotes: readonly LoteParaDescuento[],
  cantidad: number,
): DescuentoLote[] {
  validarCantidad(cantidad);
  const disponible = lotes.reduce((total, lote) => total + lote.cantidad, 0);
  if (!hayStockSuficiente(disponible, cantidad)) {
    throw new ErrorDeNegocio('STOCK_INSUFICIENTE', undefined, { disponible });
  }

  let restante = cantidad;
  const descuentos: DescuentoLote[] = [];
  for (const lote of lotes) {
    if (restante === 0) break;
    const descuento = Math.min(lote.cantidad, restante);
    if (descuento > 0) {
      descuentos.push({ loteId: lote.id, descuento });
      restante -= descuento;
    }
  }
  return descuentos;
}
