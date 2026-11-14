import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { reporteRotacion } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { exigirTiendaOperativa } from '@/lib/dataService';
import { esquemaRango } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  const storeId = await exigirTiendaOperativa(
    sesion,
    new URL(request.url).searchParams.get('storeId'),
  );
  const parametros = Object.fromEntries(new URL(request.url).searchParams.entries());
  const { desde, hasta } = esquemaRango.parse(parametros);
  return responderOk(await reporteRotacion(desde, hasta, storeId));
});
