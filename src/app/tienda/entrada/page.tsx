import Link from 'next/link';
import { FormularioEntrada } from '@/components/tienda/FormularioEntrada';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { exigirTiendaOperativa, listarInventario, obtenerTienda } from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';
import { exigirSesion } from '@/lib/auth/sesion';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EntradaPage({
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
        <h1 className="mt-3 text-3xl font-bold">Registrar entrada</h1>
        <p className="mt-2 text-texto-suave">Cada entrada queda registrada como un lote y un movimiento.</p>
      </div>
      {productos.length === 0 ? (
        <EstadoVacio
          titulo="Primero crea un producto"
          descripcion="Necesitas un producto activo para registrar una entrada."
          accion={<Link href={`/tienda/productos/nuevo?storeId=${encodeURIComponent(storeId)}`} className="font-semibold text-primario underline">Nuevo producto</Link>}
        />
      ) : (
        <Tarjeta className="max-w-2xl">
          <FormularioEntrada productos={productos} fechaHoy={hoyBogota()} storeId={storeId} />
        </Tarjeta>
      )}
    </>
  );
}
