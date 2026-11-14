import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { productosParaReordenar } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { exigirTiendaOperativa } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  const storeId = await exigirTiendaOperativa(
    sesion,
    new URL(request.url).searchParams.get('storeId'),
  );
  return responderOk(await productosParaReordenar(storeId));
});
