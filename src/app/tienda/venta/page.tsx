import Link from 'next/link';
import { FormularioVenta } from '@/components/tienda/FormularioVenta';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { exigirTiendaOperativa, listarInventario, obtenerTienda } from '@/lib/dataService';
import { redirect } from 'next/navigation';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function VentaPage({
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
  const productos = await listarInventario({}, storeId);
  return (
    <>
      <div>
        <Link href={`/tienda?storeId=${encodeURIComponent(storeId)}`} className="text-sm font-medium text-primario hover:underline">
          Volver a {tienda?.nombre}
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Registrar venta</h1>
        <p className="mt-2 text-texto-suave">La salida se descuenta por FEFO y no puede usar lotes vencidos.</p>
      </div>
      {productos.length === 0 ? (
        <EstadoVacio
          titulo="No hay productos activos"
          descripcion="Crea un producto y registra una entrada antes de vender."
          accion={<Link href={`/tienda/productos/nuevo?storeId=${encodeURIComponent(storeId)}`} className="font-semibold text-primario underline">Nuevo producto</Link>}
        />
      ) : (
        <Tarjeta className="max-w-2xl">
          <FormularioVenta productos={productos} storeId={storeId} />
        </Tarjeta>
      )}
    </>
  );
}
