export type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'NO_AUTORIZADO'
  | 'PRODUCTO_DUPLICADO'
  | 'PRODUCTO_NO_ENCONTRADO'
  | 'STOCK_INSUFICIENTE'
  | 'FECHA_INVALIDA'
  | 'TIENE_DEPENDENCIAS'
  | 'ERROR_INTERNO';

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: 'Revise los datos ingresados.',
  NO_AUTORIZADO: 'Debe iniciar sesión.',
  PRODUCTO_DUPLICADO: 'Ya existe un producto con ese código.',
  PRODUCTO_NO_ENCONTRADO: 'El producto no existe.',
  STOCK_INSUFICIENTE: 'No hay stock suficiente para la venta.',
  FECHA_INVALIDA: 'La fecha de vencimiento no puede ser anterior a la de entrada.',
  TIENE_DEPENDENCIAS: 'No se puede eliminar: tiene movimientos o lotes.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intente de nuevo.',
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  PRODUCTO_DUPLICADO: 409,
  PRODUCTO_NO_ENCONTRADO: 404,
  STOCK_INSUFICIENTE: 409,
  FECHA_INVALIDA: 422,
  TIENE_DEPENDENCIAS: 409,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  constructor(
    public readonly codigo: CodigoError,
    mensaje: string = MENSAJES[codigo],
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorDeNegocio';
  }
}
