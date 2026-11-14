import Link from 'next/link';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarTiendas } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function TiendasPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string | string[] }>;
}) {
  const sesion = await exigirSesion();
  const parametros = await searchParams;
  const tiendaActual = typeof parametros.storeId === 'string' ? parametros.storeId : sesion.storeId;
  const tiendas = await listarTiendas();
  const administrador = sesion.role === 'admin';
  const administradorTienda = sesion.role === 'store_admin';
  return (
    <>
      <div>
        {sesion.role !== 'user' && (
          <Link
            href={sesion.role === 'admin' && tiendaActual
              ? `/tienda?storeId=${encodeURIComponent(tiendaActual)}`
              : '/tienda'}
            className="text-sm font-medium text-primario hover:underline"
          >
            Volver al inventario
          </Link>
        )}
        <h1 className="mt-3 text-3xl font-bold">
          {administrador
            ? 'Tiendas de la plataforma'
            : administradorTienda ? 'Tiendas disponibles' : 'Explorar tiendas'}
        </h1>
        <p className="mt-2 text-texto-suave">
          {administrador
            ? 'Abre una tienda para revisar su catálogo y administrar su inventario.'
            : administradorTienda
              ? 'Elige una tienda para consultar su catálogo. Solo puedes administrar tu propia tienda.'
              : 'Elige una tienda para ver su catálogo de productos disponibles.'}
        </p>
      </div>
      {tiendas.length === 0 ? (
        <Tarjeta>
          <h2 className="font-semibold">Todavía no hay tiendas disponibles.</h2>
        </Tarjeta>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiendas.map((tienda) => (
            <li key={tienda.id}>
              <Tarjeta className="flex h-full flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold">{tienda.nombre}</h2>
                  <p className="mt-1 text-sm text-texto-suave">
                    {tienda.productosActivos} productos disponibles
                  </p>
                </div>
                <Link
                  href={administrador
                    ? `/tienda?storeId=${encodeURIComponent(tienda.id)}`
                    : `/tienda/catalogo/${encodeURIComponent(tienda.id)}`}
                  className="mt-auto inline-flex min-h-10 items-center justify-center rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white hover:bg-primario/90"
                >
                  {administrador ? 'Administrar tienda' : 'Ver catálogo'}
                </Link>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
