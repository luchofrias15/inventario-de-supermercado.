import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaEntrada } from '@/lib/validacion/esquemas';
import { registrarEntrada } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaEntrada);
  const entrada = await registrarEntrada(datos);
  return responderOk(entrada, 201);
});
