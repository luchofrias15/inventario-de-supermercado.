export { obtenerSesion } from '@/lib/auth/sesion';
export {
  exigirTiendaOperativa,
  listarCatalogoTienda,
  listarTiendas,
  obtenerTienda,
} from '@/lib/datos/tiendas';
export type { FilaTienda } from '@/lib/datos/tiendas';
export { cerrarPool } from '@/lib/datos/conexion';
export {
  crearProducto,
  desactivarProducto,
  listarInventario,
  obtenerProducto,
  obtenerTiendaPredeterminada,
  productosParaReordenar,
} from '@/lib/datos/productos';
export { registrarEntrada } from '@/lib/datos/entradas';
export { registrarSalida } from '@/lib/datos/salidas';
export { lotesPorVencer } from '@/lib/datos/alertas';
export { reporteRotacion } from '@/lib/datos/reportes';
export {
  cancelarPedidoCliente,
  crearPedido,
  editarPedidoCliente,
  listarPedidosCliente,
  listarPedidosTienda,
  revisarPedido,
} from '@/lib/datos/pedidos';
export type {
  DatosEntrada,
  DatosProducto,
  DetalleProducto,
  FilaInventario,
  FilaLote,
  FilaLoteVencimiento,
  FilaRotacion,
  Lote,
  Movimiento,
  ResultadoSalida,
} from '@/lib/datos/tipos';
