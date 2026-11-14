import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltros, esquemaProducto } from '@/lib/validacion/esquemas';
import { crearProducto, listarInventario } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const parametros = Object.fromEntries(new URL(request.url).searchParams.entries());
  const filtros = esquemaFiltros.parse(parametros);
  const productos = await listarInventario(filtros);
  return responderOk(productos);
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaProducto);
  const producto = await crearProducto(datos);
  return responderOk(producto, 201);
});
