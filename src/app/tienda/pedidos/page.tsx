import { redirect } from 'next/navigation';
import { ListaPedidos } from '@/components/tienda/ListaPedidos';
import { exigirSesion } from '@/lib/auth/sesion';
import {
  exigirTiendaOperativa,
  listarCatalogoTienda,
  listarPedidosCliente,
  listarPedidosTienda,
  obtenerTienda,
} from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string | string[] }>;
}) {
  const sesion = await exigirSesion();

  if (sesion.role === 'user') {
    const pedidos = await listarPedidosCliente(sesion.id);
    const storeIds = [...new Set(pedidos.map((pedido) => pedido.storeId))];
    const catalogos = await Promise.all(
      storeIds.map(async (storeId) => [storeId, await listarCatalogoTienda(storeId)] as const),
    );
    return (
      <>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis pedidos</h1>
          <p className="mt-2 text-texto-suave">Consulta el estado de tus compras a domicilio.</p>
        </div>
        <ListaPedidos
          pedidos={pedidos}
          puedeGestionar={false}
          productosPorTienda={Object.fromEntries(catalogos)}
        />
      </>
    );
  }

  const parametros = await searchParams;
  const solicitado = typeof parametros.storeId === 'string' ? parametros.storeId : undefined;
  const storeId = await exigirTiendaOperativa(sesion, solicitado);
  const tienda = await obtenerTienda(storeId);
  if (!tienda) redirect('/tienda/tiendas');
  const pedidos = await listarPedidosTienda(storeId);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos de {tienda.nombre}</h1>
        <p className="mt-2 text-texto-suave">
          Acepta pedidos para confirmar disponibilidad y descontar las existencias.
        </p>
      </div>
      <ListaPedidos pedidos={pedidos} puedeGestionar storeId={storeId} />
    </>
  );
}
