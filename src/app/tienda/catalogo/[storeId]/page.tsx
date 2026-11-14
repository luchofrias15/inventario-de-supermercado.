import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Aviso } from '@/components/ui/Aviso';
import { CatalogoCompra } from '@/components/tienda/CatalogoCompra';
import { listarCatalogoTienda, obtenerTienda } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function CatalogoTiendaPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const sesion = await exigirSesion();
  const { storeId } = await params;
  if (!z.string().uuid().safeParse(storeId).success) notFound();

  const tienda = await obtenerTienda(storeId);
  if (!tienda) notFound();
  const productos = await listarCatalogoTienda(storeId);

  return (
    <>
      <div>
        <Link href="/tienda/tiendas" className="text-sm font-medium text-primario hover:underline">
          Volver a las tiendas
        </Link>
        <h1 className="mt-3 text-3xl font-bold">{tienda.nombre}</h1>
        <p className="mt-2 text-texto-suave">Catálogo de productos disponibles en esta tienda.</p>
      </div>
      {productos.length === 0 ? (
        <Aviso>Esta tienda todavía no tiene productos en su catálogo.</Aviso>
      ) : sesion.role === 'user' ? (
        <CatalogoCompra storeId={storeId} productos={productos} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => (
            <li key={producto.id}>
              <Tarjeta className="h-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-primario">
                  {producto.categoria === 'perecedero' ? 'Perecedero' : 'No perecedero'}
                </p>
                <h2 className="mt-2 text-xl font-bold">{producto.nombre}</h2>
                <p className="mt-1 font-mono text-sm text-texto-suave">{producto.codigo}</p>
                <p className="mt-4 text-sm">
                  Disponibles: <strong>{producto.stockDisponible}</strong>
                </p>
                <p className="mt-2 text-sm">
                  Precio por unidad:{' '}
                  <strong>
                    {producto.precioUnitario === null
                      ? 'No registrado'
                      : `$ ${producto.precioUnitario.toLocaleString('es-CO')} COP`}
                  </strong>
                </p>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
