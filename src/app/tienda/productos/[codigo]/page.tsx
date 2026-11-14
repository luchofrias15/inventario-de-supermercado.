import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { InsigniaEstado } from '@/components/tienda/InsigniaEstado';
import { ListaMovimientos, TablaLotes } from '@/components/tienda/TablaLotes';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { exigirTiendaOperativa, obtenerProducto, obtenerTienda } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function DetalleProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ storeId?: string | string[] }>;
}) {
  const { codigo } = await params;
  const sesion = await exigirSesion();
  if (sesion.role === 'user') notFound();
  const parametros = await searchParams;
  const requestedStoreId = typeof parametros.storeId === 'string' ? parametros.storeId : undefined;
  const storeId = await exigirTiendaOperativa(sesion, requestedStoreId);
  const tienda = await obtenerTienda(storeId);
  let producto;
  try {
    producto = await obtenerProducto(codigo, storeId);
  } catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === 'PRODUCTO_NO_ENCONTRADO') notFound();
    throw error;
  }

  return (
    <>
      <div>
        <Link href={`/tienda?storeId=${encodeURIComponent(storeId)}`} className="text-sm font-medium text-primario hover:underline">
          Volver a {tienda?.nombre}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{producto.nombre}</h1>
          <InsigniaEstado estado={producto.activo ? (producto.paraReordenar ? 'para_reordenar' : 'normal') : 'inactivo'} />
        </div>
        <p className="mt-2 font-mono text-sm text-texto-suave">{producto.codigo}</p>
      </div>

      {producto.paraReordenar && (
        <Aviso tipo="advertencia">
          Quedan {producto.stockDisponible} unidades (punto de reorden: {producto.puntoReorden}).
        </Aviso>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Tarjeta className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Lotes</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Stock disponible: <strong className="font-mono tabular-nums">{producto.stockDisponible}</strong>
            </p>
          </div>
          <TablaLotes lotes={producto.lotes} />
        </Tarjeta>
        <Tarjeta>
          <h2 className="text-xl font-bold">Movimientos recientes</h2>
          <ListaMovimientos movimientos={producto.movimientos} />
        </Tarjeta>
      </div>
    </>
  );
}
