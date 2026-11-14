import { CATEGORIAS } from '@/lib/config/tienda';
import { ErrorDeNegocio } from './errores';
import { esFechaValida, diasEntre } from './fechas';
import type { Categoria } from './producto';

export interface DatosEntradaValidar {
  cantidad: number;
  categoria: Categoria;
  fechaEntrada: string;
  fechaVencimiento?: string | null;
}

export function validarEntrada(datos: DatosEntradaValidar): void {
  if (!Number.isInteger(datos.cantidad) || datos.cantidad <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  if (!CATEGORIAS.some((categoria) => categoria === datos.categoria)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  if (!esFechaValida(datos.fechaEntrada)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  if (datos.categoria === 'perecedero') {
    if (!datos.fechaVencimiento) throw new ErrorDeNegocio('DATOS_INVALIDOS');
    if (!esFechaValida(datos.fechaVencimiento)) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS');
    }
    if (diasEntre(datos.fechaEntrada, datos.fechaVencimiento) < 0) {
      throw new ErrorDeNegocio('FECHA_INVALIDA');
    }
  }
}
