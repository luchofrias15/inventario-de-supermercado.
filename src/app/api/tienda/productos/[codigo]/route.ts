import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { obtenerProducto } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(
  async (_request: Request, { params }: { params: Promise<{ codigo: string }> }) => {
    await exigirSesion();
    const { codigo } = await params;
    return responderOk(await obtenerProducto(codigo));
  },
);
