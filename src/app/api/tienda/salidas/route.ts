import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaSalida } from '@/lib/validacion/esquemas';
import { registrarSalida } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaSalida);
  const salida = await registrarSalida(datos.codigo, datos.cantidad);
  return responderOk(salida, 201);
});
