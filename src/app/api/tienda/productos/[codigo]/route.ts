import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { desactivarProducto, obtenerProducto } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { exigirTiendaOperativa } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(
  async (_request: Request, { params }: { params: Promise<{ codigo: string }> }) => {
    const sesion = await exigirSesion();
    const storeId = await exigirTiendaOperativa(
      sesion,
      new URL(_request.url).searchParams.get('storeId'),
    );
    const { codigo } = await params;
    return responderOk(await obtenerProducto(codigo, storeId));
  },
);

export const DELETE = conManejoDeErrores(
  async (_request: Request, { params }: { params: Promise<{ codigo: string }> }) => {
    const sesion = await exigirSesion();
    const storeId = await exigirTiendaOperativa(
      sesion,
      new URL(_request.url).searchParams.get('storeId'),
    );
    const { codigo } = await params;
    await desactivarProducto(codigo, storeId);
    return responderOk({ codigo, activo: false });
  },
);
