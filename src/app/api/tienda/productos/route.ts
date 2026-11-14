import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltros, esquemaProducto } from '@/lib/validacion/esquemas';
import { crearProducto, exigirTiendaOperativa, listarInventario } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  const parametros = Object.fromEntries(new URL(request.url).searchParams.entries());
  const filtros = esquemaFiltros.parse(parametros);
  const storeId = await exigirTiendaOperativa(sesion, parametros.storeId);
  const productos = await listarInventario(filtros, storeId);
  return responderOk(productos);
});

export const POST = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  const storeId = await exigirTiendaOperativa(
    sesion,
    new URL(request.url).searchParams.get('storeId'),
  );
  const datos = await leerCuerpo(request, esquemaProducto);
  const producto = await crearProducto(datos, storeId);
  return responderOk(producto, 201);
});
