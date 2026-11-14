import { consultar } from '@/lib/db/conexion';
import type { SesionUsuario } from '@/lib/auth/sesion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import type { FilaInventario } from './tipos';
import { listarInventario } from './productos';

export interface FilaTienda {
  id: string;
  nombre: string;
  productosActivos: number;
}

export async function listarTiendas(storeId?: string): Promise<FilaTienda[]> {
  const tiendas = await consultar<{
    id: string;
    name: string;
    product_count: number;
  }>(
    `SELECT stores.id, stores.name,
            count(productos.id)::integer AS product_count
     FROM public.stores AS stores
     LEFT JOIN public.productos AS productos
       ON productos.store_id = stores.id AND productos.activo = true
     ${storeId ? 'WHERE stores.id = $1' : ''}
     GROUP BY stores.id, stores.name
     ORDER BY stores.name ASC`,
    storeId ? [storeId] : [],
  );
  return tiendas.map((tienda) => ({
    id: tienda.id,
    nombre: tienda.name,
    productosActivos: tienda.product_count,
  }));
}

export async function obtenerTienda(id: string): Promise<FilaTienda | null> {
  const [tienda] = await listarTiendas(id);
  return tienda ?? null;
}

export async function listarCatalogoTienda(storeId: string): Promise<FilaInventario[]> {
  return listarInventario({}, storeId);
}

export async function exigirTiendaOperativa(
  sesion: SesionUsuario,
  storeIdSolicitado?: string | null,
): Promise<string> {
  if (sesion.role === 'user') throw new ErrorDeNegocio('PERMISO_DENEGADO');

  const storeId =
    sesion.role === 'admin'
      ? storeIdSolicitado || sesion.storeId
      : sesion.storeId;
  if (!storeId) {
    throw new Error('El perfil no tiene una tienda asignada. Aplica la migración de roles y tiendas.');
  }
  if (sesion.role === 'store_admin' && storeIdSolicitado && storeIdSolicitado !== sesion.storeId) {
    throw new ErrorDeNegocio('PERMISO_DENEGADO');
  }

  if (!(await obtenerTienda(storeId))) throw new ErrorDeNegocio('DATOS_INVALIDOS');
  return storeId;
}
