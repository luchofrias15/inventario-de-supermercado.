export { obtenerSesion } from '@/lib/auth/sesion';
export { cerrarPool } from '@/lib/datos/conexion';
export {
  crearProducto,
  desactivarProducto,
  listarInventario,
  obtenerProducto,
  productosParaReordenar,
} from '@/lib/datos/productos';
export { registrarEntrada } from '@/lib/datos/entradas';
export { registrarSalida } from '@/lib/datos/salidas';
export type {
  DatosEntrada,
  DatosProducto,
  DetalleProducto,
  FilaInventario,
  FilaLote,
  FilaRotacion,
  Lote,
  Movimiento,
  ResultadoSalida,
} from '@/lib/datos/tipos';
