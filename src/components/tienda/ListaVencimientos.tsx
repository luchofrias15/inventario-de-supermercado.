import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { InsigniaEstado } from '@/components/tienda/InsigniaEstado';
import { formatearFecha } from '@/lib/formato';
import type { FilaLoteVencimiento } from '@/lib/datos/tipos';

export function ListaVencimientos({
  lotes,
}: {
  lotes: FilaLoteVencimiento[];
}) {
  const estado = lotes[0]?.estadoVencimiento ?? 'por_vencer';
  if (lotes.length === 0) {
    return (
      <EstadoVacio
        titulo={estado === 'por_vencer' ? 'No hay lotes próximos a vencer' : 'No hay lotes vencidos'}
        descripcion={
          estado === 'por_vencer'
            ? 'No se encontraron lotes con existencias que venzan dentro de los próximos cinco días.'
            : 'No se encontraron lotes vencidos con existencias.'
        }
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-borde md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            {estado === 'por_vencer' ? 'Lotes próximos a vencer' : 'Lotes vencidos'}
          </caption>
          <thead className="bg-fondo text-xs uppercase text-texto-suave">
            <tr>
              <th scope="col" className="px-4 py-3">Producto</th>
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3 text-right">Unidades</th>
              <th scope="col" className="px-4 py-3">Vencimiento</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote) => (
              <tr key={lote.id} className="border-t border-borde">
                <td className="px-4 py-3 font-medium">{lote.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs">{lote.codigo}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{lote.cantidad}</td>
                <td className="px-4 py-3">{formatearFecha(lote.fechaVencimiento)}</td>
                <td className="px-4 py-3">
                  <InsigniaEstado estado={lote.estadoVencimiento} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {lotes.map((lote) => (
          <li key={lote.id} className="rounded-xl border border-borde p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{lote.nombre}</h3>
                <p className="mt-1 font-mono text-xs text-texto-suave">{lote.codigo}</p>
              </div>
              <InsigniaEstado estado={lote.estadoVencimiento} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-texto-suave">Unidades</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums">{lote.cantidad}</dd>
              </div>
              <div>
                <dt className="text-texto-suave">Vencimiento</dt>
                <dd className="mt-1">{formatearFecha(lote.fechaVencimiento)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
