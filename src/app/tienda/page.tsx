import Link from 'next/link';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { PanelAlertas } from '@/components/tienda/PanelAlertas';
import { TablaInventario } from '@/components/tienda/TablaInventario';
import { listarInventario, productosParaReordenar } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function PaginaTienda() {
  const [productos, alertas] = await Promise.all([
    listarInventario(),
    productosParaReordenar(),
  ]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primario">Mi Tienda</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="mt-2 text-texto-suave">Consulta existencias y productos que necesitan reposición.</p>
        </div>
        <Link
          href="/tienda/productos/nuevo"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          Nuevo producto
        </Link>
      </div>

      <PanelAlertas productos={alertas} />

      <Tarjeta className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">Productos</h2>
          <p className="mt-1 text-sm text-texto-suave">
            El stock disponible excluye los lotes vencidos.
          </p>
        </div>
        <TablaInventario productos={productos} />
      </Tarjeta>
    </>
  );
}
