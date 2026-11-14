import { Insignia } from '@/components/ui/Insignia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { formatearFecha } from '@/lib/formato';
import type { Lote, Movimiento } from '@/lib/datos/tipos';

function EstadoLote({ lote }: { lote: Lote }) {
  if (!lote.fechaVencimiento) return <Insignia tono="neutro">Sin vencimiento</Insignia>;
  if (lote.estadoVencimiento === 'vencido') return <Insignia tono="vencido">Vencido</Insignia>;
  if (lote.estadoVencimiento === 'por_vencer') return <Insignia tono="reorden">Por vencer</Insignia>;
  return <Insignia tono="normal">Vigente</Insignia>;
}

export function TablaLotes({ lotes }: { lotes: Lote[] }) {
  if (lotes.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin lotes registrados"
        descripcion="Registra una entrada para crear el primer lote de este producto."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-borde md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-fondo text-xs uppercase text-texto-suave">
            <tr>
              <th scope="col" className="px-4 py-3">Cantidad</th>
              <th scope="col" className="px-4 py-3">Fecha de entrada</th>
              <th scope="col" className="px-4 py-3">Vencimiento</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote) => (
              <tr key={lote.id} className="border-t border-borde">
                <td className="px-4 py-3 font-mono tabular-nums">{lote.cantidad}</td>
                <td className="px-4 py-3">{formatearFecha(lote.fechaEntrada)}</td>
                <td className="px-4 py-3">
                  {lote.fechaVencimiento ? formatearFecha(lote.fechaVencimiento) : '—'}
                </td>
                <td className="px-4 py-3"><EstadoLote lote={lote} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {lotes.map((lote) => (
          <li key={lote.id} className="rounded-xl border border-borde p-4">
            <div className="flex items-center justify-between gap-2">
              <strong className="font-mono tabular-nums">{lote.cantidad} unidades</strong>
              <EstadoLote lote={lote} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-texto-suave">Entrada</dt><dd>{formatearFecha(lote.fechaEntrada)}</dd></div>
              <div>
                <dt className="text-texto-suave">Vencimiento</dt>
                <dd>{lote.fechaVencimiento ? formatearFecha(lote.fechaVencimiento) : '—'}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ListaMovimientos({ movimientos }: { movimientos: Movimiento[] }) {
  if (movimientos.length === 0) {
    return <p className="text-sm text-texto-suave">Todavía no hay movimientos.</p>;
  }

  return (
    <ul className="divide-y divide-borde">
      {movimientos.map((movimiento) => (
        <li key={movimiento.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <span>
            {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} · {formatearFecha(movimiento.fecha)}
          </span>
          <span className="font-mono font-semibold tabular-nums">
            {movimiento.tipo === 'entrada' ? '+' : '−'}{movimiento.cantidad}
          </span>
        </li>
      ))}
    </ul>
  );
}
