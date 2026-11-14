import { z } from 'zod';
import { exigirSesion } from '@/lib/auth/sesion';
import {
  cancelarPedidoCliente,
  crearPedido,
  editarPedidoCliente,
  exigirTiendaOperativa,
  listarPedidosCliente,
  listarPedidosTienda,
  revisarPedido,
} from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import {
  esquemaCancelarPedido,
  esquemaCrearPedido,
  esquemaEditarPedido,
  esquemaRevisionPedido,
} from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  if (sesion.role === 'user') {
    return responderOk(await listarPedidosCliente(sesion.id));
  }
  const storeId = await exigirTiendaOperativa(
    sesion,
    new URL(request.url).searchParams.get('storeId'),
  );
  return responderOk(await listarPedidosTienda(storeId));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  if (sesion.role !== 'user') throw new ErrorDeNegocio('PERMISO_DENEGADO');
  const parametros = new URL(request.url).searchParams;
  const storeId = z.string().uuid().safeParse(parametros.get('storeId'));
  if (!storeId.success) throw new ErrorDeNegocio('DATOS_INVALIDOS');
  const datos = await leerCuerpo(request, esquemaCrearPedido);
  const pedido = await crearPedido(sesion.id, sesion.email, storeId.data, datos);
  return responderOk(pedido, 201);
});

export const PATCH = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  const storeId = await exigirTiendaOperativa(
    sesion,
    new URL(request.url).searchParams.get('storeId'),
  );
  const { id, decision } = await leerCuerpo(request, esquemaRevisionPedido);
  await revisarPedido(id, storeId, sesion.id, decision);
  return responderOk({ id, decision });
});

export const PUT = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  if (sesion.role !== 'user') throw new ErrorDeNegocio('PERMISO_DENEGADO');
  const datos = await leerCuerpo(request, esquemaEditarPedido);
  const { pedidoId, ...datosPedido } = datos;
  const pedido = await editarPedidoCliente(pedidoId, sesion.id, datosPedido);
  return responderOk(pedido);
});

export const DELETE = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  if (sesion.role !== 'user') throw new ErrorDeNegocio('PERMISO_DENEGADO');
  const { pedidoId } = await leerCuerpo(request, esquemaCancelarPedido);
  await cancelarPedidoCliente(pedidoId, sesion.id);
  return responderOk({ id: pedidoId, estado: 'cancelled' });
});
