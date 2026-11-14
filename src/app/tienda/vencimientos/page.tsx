import Link from 'next/link';
import { ListaVencimientos } from '@/components/tienda/ListaVencimientos';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { lotesPorVencer } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function VencimientosPage() {
  const lotes = await lotesPorVencer();
  const porVencer = lotes.filter((lote) => lote.estadoVencimiento === 'por_vencer');
  const vencidos = lotes.filter((lote) => lote.estadoVencimiento === 'vencido');

  return (
    <>
      <div>
        <Link href="/tienda" className="text-sm font-medium text-primario hover:underline">
          Volver al inventario
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
