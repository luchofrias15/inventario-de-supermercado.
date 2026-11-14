import Link from 'next/link';
import { Aviso } from '@/components/ui/Aviso';
import type { FilaInventario } from '@/lib/datos/tipos';

export function PanelAlertas({ productos }: { productos: FilaInventario[] }) {
  if (productos.length === 0) return null;

  return (
    <Aviso tipo="advertencia" aria-labelledby="titulo-alertas">
      <h2 id="titulo-alertas" className="font-bold">
        {productos.length === 1
          ? '1 producto para reordenar'
          : `${productos.length} productos para reordenar`}
      </h2>
      <ul className="mt-2 space-y-1">
        {productos.map((producto) => (
          <li key={producto.id}>
            <Link
              href={`/tienda/productos/${encodeURIComponent(producto.codigo)}`}
              className="font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-primario"
            >
              {producto.nombre}: quedan {producto.stockDisponible} unidades (punto de reorden: 10).
            </Link>
          </li>
        ))}
      </ul>
    </Aviso>
  );
}
