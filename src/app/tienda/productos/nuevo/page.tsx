import Link from 'next/link';
import { FormularioProducto } from '@/components/tienda/FormularioProducto';
import { Tarjeta } from '@/components/ui/Tarjeta';

export default function NuevoProductoPage() {
  return (
    <>
      <div>
        <Link href="/tienda" className="text-sm font-medium text-primario hover:underline">
          Volver al inventario
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Nuevo producto</h1>
        <p className="mt-2 text-texto-suave">El producto se crea con stock disponible en cero.</p>
      </div>
      <Tarjeta className="max-w-2xl">
        <FormularioProducto />
      </Tarjeta>
    </>
  );
}
