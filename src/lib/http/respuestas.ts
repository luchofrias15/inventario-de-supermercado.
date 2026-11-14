import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { ESTADO_HTTP, ErrorDeNegocio, MENSAJES, type CodigoError } from '@/lib/reglas/errores';

const HEADERS_SIN_CACHE = { 'Cache-Control': 'no-store' };

export function responderOk<T>(datos: T, estado = 200): NextResponse {
  return NextResponse.json({ ok: true, datos }, { status: estado, headers: HEADERS_SIN_CACHE });
}

function esErrorPostgres(
  error: unknown,
): error is { code: string; constraint?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function errorDePostgres(error: { code: string; constraint?: string }): ErrorDeNegocio | null {
  if (error.code === '23505') return new ErrorDeNegocio('PRODUCTO_DUPLICADO');
  if (error.code === '23503') return new ErrorDeNegocio('TIENE_DEPENDENCIAS');
  if (error.code === '23514') {
    if (error.constraint === 'lotes_fechas_coherentes') {
      return new ErrorDeNegocio('FECHA_INVALIDA');
    }
    if (error.constraint === 'lotes_cantidad_no_neg') {
      return new ErrorDeNegocio('STOCK_INSUFICIENTE');
    }
    return new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return null;
}

export function responderError(error: unknown): NextResponse {
  let codigo: CodigoError;
  let detalles: unknown;

  if (error instanceof ErrorDeNegocio) {
    codigo = error.codigo;
    detalles = error.detalles;
  } else if (error instanceof ZodError) {
    codigo = 'DATOS_INVALIDOS';
    detalles = error.flatten();
  } else if (esErrorPostgres(error)) {
    const errorNegocio = errorDePostgres(error);
    if (errorNegocio) {
      codigo = errorNegocio.codigo;
      detalles = errorNegocio.detalles;
    } else {
      console.error('Error de PostgreSQL no clasificado:', error);
      codigo = 'ERROR_INTERNO';
    }
  } else {
    console.error('Error inesperado en la API de tienda:', error);
    codigo = 'ERROR_INTERNO';
  }

  const errorRespuesta: {
    codigo: CodigoError;
    mensaje: string;
    detalles?: unknown;
  } = {
    codigo,
    mensaje: error instanceof ErrorDeNegocio ? error.message : MENSAJES[codigo],
  };
  if (detalles !== undefined) errorRespuesta.detalles = detalles;

  return NextResponse.json(
    { ok: false, error: errorRespuesta },
    { status: ESTADO_HTTP[codigo], headers: HEADERS_SIN_CACHE },
  );
}

export function conManejoDeErrores<TArgs extends unknown[]>(
  manejador: (...args: TArgs) => Promise<Response>,
): (...args: TArgs) => Promise<Response> {
  return async (...args) => {
    try {
      return await manejador(...args);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo<T extends ZodType>(
  request: Request,
  esquema: T,
): Promise<T['_output']> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new ErrorDeNegocio('DATOS_INVALIDOS');
    throw error;
  }
  return esquema.parse(cuerpo);
}
