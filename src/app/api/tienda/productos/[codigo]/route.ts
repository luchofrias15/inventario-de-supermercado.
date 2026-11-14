import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { actualizarPrecioProducto, desactivarProducto, obtenerProducto } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { exigirTiendaOperativa } from '@/lib/dataService';
import { esquemaPrecioProducto } from '@/lib/validacion/esquemas';

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

export const PATCH = conManejoDeErrores(
  async (request: Request, { params }: { params: Promise<{ codigo: string }> }) => {
    const sesion = await exigirSesion();
    const storeId = await exigirTiendaOperativa(
      sesion,
      new URL(request.url).searchParams.get('storeId'),
    );
    const { codigo } = await params;
    const { precioUnitario } = await leerCuerpo(request, esquemaPrecioProducto);
    return responderOk(await actualizarPrecioProducto(codigo, precioUnitario, storeId));
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
