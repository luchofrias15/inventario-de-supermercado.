import { CATEGORIAS } from '@/lib/config/tienda';
import { ErrorDeNegocio } from './errores';

export type Categoria = (typeof CATEGORIAS)[number];

export interface DatosProductoValidar {
  codigo: string;
  nombre: string;
  categoria: string;
}

export function validarProducto(datos: DatosProductoValidar): void {
  if (
    !datos.codigo.trim() ||
    !datos.nombre.trim() ||
    !CATEGORIAS.some((categoria) => categoria === datos.categoria)
  ) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}
