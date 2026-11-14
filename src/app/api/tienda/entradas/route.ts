import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaEntrada } from '@/lib/validacion/esquemas';
import { registrarEntrada } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { exigirTiendaOperativa } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  const storeId = await exigirTiendaOperativa(
    sesion,
    new URL(request.url).searchParams.get('storeId'),
  );
  const datos = await leerCuerpo(request, esquemaEntrada);
  const entrada = await registrarEntrada(datos, storeId);
  return responderOk(entrada, 201);
});
