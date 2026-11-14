import Link from 'next/link';
import { FormularioVenta } from '@/components/tienda/FormularioVenta';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { listarInventario } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function VentaPage() {
  const productos = await listarInventario();
  return (
    <>
      <div>
        <Link href="/tienda" className="text-sm font-medium text-primario hover:underline">
          Volver al inventario
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Registrar venta</h1>
        <p className="mt-2 text-texto-suave">La salida se descuenta por FEFO y no puede usar lotes vencidos.</p>
      </div>
      {productos.length === 0 ? (
        <EstadoVacio
          titulo="No hay productos activos"
          descripcion="Crea un producto y registra una entrada antes de vender."
          accion={<Link href="/tienda/productos/nuevo" className="font-semibold text-primario underline">Nuevo producto</Link>}
        />
      ) : (
        <Tarjeta className="max-w-2xl">
          <FormularioVenta productos={productos} />
        </Tarjeta>
      )}
    </>
  );
}
