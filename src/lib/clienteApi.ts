export type RespuestaApi<T> =
  | { ok: true; datos: T }
  | { ok: false; error: { codigo: string; mensaje: string; detalles?: unknown } };

export class ErrorApi extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

export async function leerRespuestaApi<T>(respuesta: Response): Promise<T> {
  const resultado: unknown = await respuesta.json();
  if (typeof resultado !== 'object' || resultado === null || !('ok' in resultado)) {
    throw new Error('El servidor devolvió una respuesta inválida.');
  }
  const cuerpo = resultado as RespuestaApi<T>;
  if (!respuesta.ok || !cuerpo.ok) {
    if (!cuerpo.ok) {
      throw new ErrorApi(cuerpo.error.codigo, cuerpo.error.mensaje, cuerpo.error.detalles);
    }
    throw new Error('No se pudo completar la solicitud.');
  }
  return cuerpo.datos;
}
