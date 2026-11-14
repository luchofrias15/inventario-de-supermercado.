import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { reporteRotacion } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { esquemaRango } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const parametros = Object.fromEntries(new URL(request.url).searchParams.entries());
  const { desde, hasta } = esquemaRango.parse(parametros);
  return responderOk(await reporteRotacion(desde, hasta));
});
