import type { Categoria } from '@/lib/reglas/producto';
import type { EstadoVencimiento } from '@/lib/reglas/vencimiento';

export interface FilaInventario {
  id: string;
  codigo: string;
  nombre: string;
  categoria: Categoria;
  precioUnitario: number | null;
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
  precioUnitario: number;
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

export type FilaLoteVencimiento =
  | (FilaLote & { fechaVencimiento: string; estadoVencimiento: 'por_vencer' })
  | (FilaLote & { fechaVencimiento: string; estadoVencimiento: 'vencido' });

export interface FilaRotacion {
  codigo: string;
  nombre: string;
  unidadesVendidas: number;
}

export type MetodoPagoPedido = 'transferencia' | 'efectivo';
export type EstadoPedido = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface ItemPedido {
  productId: string;
  codigo: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  total: number;
}

export interface Pedido {
  id: string;
  storeId: string;
  tienda: string;
  customerId: string;
  correoCliente: string;
  nombreCliente: string;
  telefonoCliente: string;
  direccion: string;
  barrio: string;
  instrucciones: string;
  metodoPago: MetodoPagoPedido;
  estado: EstadoPedido;
  subtotal: number;
  creadoEn: string;
  items: ItemPedido[];
}
