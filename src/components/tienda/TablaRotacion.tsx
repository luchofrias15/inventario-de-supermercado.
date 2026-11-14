import { EstadoVacio } from '@/components/ui/EstadoVacio';
import type { FilaRotacion } from '@/lib/datos/tipos';

export function TablaRotacion({ filas }: { filas: FilaRotacion[] }) {
  if (filas.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay productos para mostrar"
        descripcion="Crea productos y registra ventas para consultar su rotación."
      />
    );
  }

  const totalVendido = filas.reduce((total, fila) => total + fila.unidadesVendidas, 0);

  return (
    <section aria-label="Productos ordenados por unidades vendidas" className="space-y-4">
      {totalVendido === 0 && (
        <p className="rounded-lg bg-fondo p-3 text-sm text-texto-suave">
          No hubo ventas en este periodo. Los productos se muestran empatados en cero.
        </p>
      )}
      <div className="hidden overflow-x-auto rounded-xl border border-borde md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Reporte de rotación por unidades vendidas</caption>
          <thead className="bg-fondo text-xs uppercase text-texto-suave">
            <tr>
              <th scope="col" className="px-4 py-3">Posición</th>
              <th scope="col" className="px-4 py-3">Producto</th>
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3 text-right">Unidades vendidas</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, indice) => (
              <tr key={fila.codigo} className="border-t border-borde">
                <td className="px-4 py-3 font-mono tabular-nums">{indice + 1}</td>
                <td className="px-4 py-3 font-medium">{fila.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs">{fila.codigo}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                  {fila.unidadesVendidas}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="grid gap-3 md:hidden">
        {filas.map((fila, indice) => (
          <li key={fila.codigo} className="flex items-center justify-between gap-3 rounded-xl border border-borde p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="font-mono text-sm text-texto-suave">{indice + 1}.</span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{fila.nombre}</p>
                <p className="mt-1 font-mono text-xs text-texto-suave">{fila.codigo}</p>
              </div>
            </div>
            <span className="shrink-0 font-mono font-semibold tabular-nums">
              {fila.unidadesVendidas}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
