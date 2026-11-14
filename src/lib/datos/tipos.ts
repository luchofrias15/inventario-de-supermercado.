import type { Categoria } from '@/lib/reglas/producto';
import type { EstadoVencimiento } from '@/lib/reglas/vencimiento';

export interface FilaInventario {
  id: string;
  codigo: string;
  nombre: string;
  categoria: Categoria;
  proveedor: string | null;
  puntoReorden: number;
  stockDisponible: number;
  paraReordenar: boolean;
}

export interface Lote {
  id: number;
  cantidad: number;
  fechaEntrada: string;
  fechaVencimiento: string | null;
  estadoVencimiento: EstadoVencimiento | null;
}

export interface Movimiento {
  id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
}

export interface DetalleProducto extends FilaInventario {
  activo: boolean;
  lotes: Lote[];
  movimientos: Movimiento[];
}

export interface DatosProducto {
  codigo: string;
  nombre: string;
  categoria: Categoria;
  proveedor?: string;
}

export interface DatosEntrada {
  codigo: string;
  cantidad: number;
  fechaEntrada: string;
  fechaVencimiento?: string;
}

export interface ResultadoSalida {
  stock: number;
  paraReordenar: boolean;
}

export interface FilaLote extends Lote {
  codigo: string;
  nombre: string;
}

export interface FilaRotacion {
  codigo: string;
  nombre: string;
  unidadesVendidas: number;
}
