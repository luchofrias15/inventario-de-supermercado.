import { z } from 'zod';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { exigirSesion } from '@/lib/auth/sesion';
import { listarCatalogoTienda, obtenerTienda } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) => {
  const sesion = await exigirSesion();
  const { storeId } = await params;
  const validacion = z.string().uuid().safeParse(storeId);
  if (!validacion.success) throw new ErrorDeNegocio('DATOS_INVALIDOS');
  const tienda = await obtenerTienda(storeId);
  if (!tienda) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'No se encontró la tienda.');
  return responderOk({
    tienda,
    productos: await listarCatalogoTienda(storeId),
  });
});
