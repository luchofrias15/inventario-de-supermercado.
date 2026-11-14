import Link from 'next/link';
import { ListaVencimientos } from '@/components/tienda/ListaVencimientos';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { exigirTiendaOperativa, lotesPorVencer, obtenerTienda } from '@/lib/dataService';
import { redirect } from 'next/navigation';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function VencimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string | string[] }>;
}) {
  const sesion = await exigirSesion();
  if (sesion.role === 'user') redirect('/tienda');
  const parametros = await searchParams;
  const requestedStoreId = typeof parametros.storeId === 'string' ? parametros.storeId : undefined;
  const storeId = await exigirTiendaOperativa(sesion, requestedStoreId);
  const tienda = await obtenerTienda(storeId);
  const lotes = await lotesPorVencer(storeId);
  const porVencer = lotes.filter((lote) => lote.estadoVencimiento === 'por_vencer');
  const vencidos = lotes.filter((lote) => lote.estadoVencimiento === 'vencido');

  return (
    <>
      <div>
        <Link href={`/tienda?storeId=${encodeURIComponent(storeId)}`} className="text-sm font-medium text-primario hover:underline">
          Volver a {tienda?.nombre}
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Alertas de vencimiento</h1>
        <p className="mt-2 text-texto-suave">
          Se muestran lotes con unidades disponibles. Los lotes vencidos no se pueden vender.
        </p>
      </div>
      <Tarjeta className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Por vencer</h2>
          <p className="mt-1 text-sm text-texto-suave">Vencen dentro de los próximos cinco días.</p>
        </div>
        <ListaVencimientos lotes={porVencer} />
      </Tarjeta>
      <Tarjeta className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Vencidos</h2>
          <p className="mt-1 text-sm text-texto-suave">Fecha de vencimiento anterior a hoy.</p>
        </div>
        <ListaVencimientos lotes={vencidos} />
      </Tarjeta>
    </>
  );
}
