import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { lotesPorVencer } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  await exigirSesion();
  return responderOk(await lotesPorVencer());
});
