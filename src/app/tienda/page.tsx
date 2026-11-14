import Link from 'next/link';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { PanelAlertas } from '@/components/tienda/PanelAlertas';
import { TablaInventario } from '@/components/tienda/TablaInventario';
import { listarInventario, productosParaReordenar } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { exigirTiendaOperativa, obtenerTienda } from '@/lib/dataService';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PaginaTienda({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string | string[] }>;
}) {
  const sesion = await exigirSesion();
  if (sesion.role === 'user') redirect('/tienda/tiendas');
  const parametros = await searchParams;
  const storeIdSolicitado = typeof parametros.storeId === 'string' ? parametros.storeId : undefined;
  const storeId = await exigirTiendaOperativa(sesion, storeIdSolicitado);
  const tienda = await obtenerTienda(storeId);
  const [productos, alertas] = await Promise.all([
    listarInventario({}, storeId),
    productosParaReordenar(storeId),
  ]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primario">{tienda?.nombre}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="mt-2 text-texto-suave">Consulta existencias y productos que necesitan reposición.</p>
        </div>
        {sesion.role === 'admin' && (
          <Link
            href="/tienda/tiendas"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-borde px-4 py-2 text-sm font-semibold"
          >
            Cambiar tienda
          </Link>
        )}
        <Link
          href={`/tienda/productos/nuevo?storeId=${encodeURIComponent(storeId)}`}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          Nuevo producto
        </Link>
      </div>

      <PanelAlertas productos={alertas} storeId={storeId} />

      <Tarjeta className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">Productos</h2>
          <p className="mt-1 text-sm text-texto-suave">
            El stock disponible excluye los lotes vencidos.
          </p>
        </div>
        <TablaInventario
          productos={productos}
          puedeAdministrar
          storeId={storeId}
        />
      </Tarjeta>
    </>
  );
}
