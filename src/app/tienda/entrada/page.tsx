import Link from 'next/link';
import { FormularioEntrada } from '@/components/tienda/FormularioEntrada';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { listarInventario } from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

export default async function EntradaPage() {
  const productos = await listarInventario();
  return (
    <>
      <div>
        <Link href="/tienda" className="text-sm font-medium text-primario hover:underline">
          Volver al inventario
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Registrar entrada</h1>
        <p className="mt-2 text-texto-suave">Cada entrada queda registrada como un lote y un movimiento.</p>
      </div>
      {productos.length === 0 ? (
        <EstadoVacio
          titulo="Primero crea un producto"
          descripcion="Necesitas un producto activo para registrar una entrada."
          accion={<Link href="/tienda/productos/nuevo" className="font-semibold text-primario underline">Nuevo producto</Link>}
        />
      ) : (
        <Tarjeta className="max-w-2xl">
          <FormularioEntrada productos={productos} fechaHoy={hoyBogota()} />
        </Tarjeta>
      )}
    </>
  );
}
