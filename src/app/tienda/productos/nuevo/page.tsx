import Link from 'next/link';
import { FormularioProducto } from '@/components/tienda/FormularioProducto';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { redirect } from 'next/navigation';
import { exigirSesion } from '@/lib/auth/sesion';
import { exigirTiendaOperativa, obtenerTienda } from '@/lib/dataService';

export default async function NuevoProductoPage({
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
  return (
    <>
      <div>
        <Link href={`/tienda?storeId=${encodeURIComponent(storeId)}`} className="text-sm font-medium text-primario hover:underline">
          Volver a {tienda?.nombre}
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Nuevo producto</h1>
        <p className="mt-2 text-texto-suave">El producto se crea con stock disponible en cero.</p>
      </div>
      <Tarjeta className="max-w-2xl">
        <FormularioProducto storeId={storeId} />
      </Tarjeta>
    </>
  );
}
