'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { InsigniaEstado } from '@/components/tienda/InsigniaEstado';
import { Aviso } from '@/components/ui/Aviso';
import { leerRespuestaApi } from '@/lib/clienteApi';
import type { FilaInventario } from '@/lib/datos/tipos';

function EstadoProducto({ producto }: { producto: FilaInventario }) {
  return <InsigniaEstado estado={producto.paraReordenar ? 'para_reordenar' : 'normal'} />;
}

export function TablaInventario({
  productos,
  puedeAdministrar = true,
  storeId,
}: {
  productos: FilaInventario[];
  puedeAdministrar?: boolean;
  storeId: string;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [soloReorden, setSoloReorden] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function ocultarProducto(producto: FilaInventario) {
    const confirmado = window.confirm(
      `¿Ocultar "${producto.nombre}" del inventario? Se desactivará y conservará su historial.`,
    );
    if (!confirmado) return;

    setProcesando(producto.codigo);
    setError('');
    try {
      const respuesta = await fetch(
        `/api/tienda/productos/${encodeURIComponent(producto.codigo)}?storeId=${encodeURIComponent(storeId)}`,
        { method: 'DELETE' },
      );
      await leerRespuestaApi<{ codigo: string; activo: boolean }>(respuesta);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo ocultar el producto.');
    } finally {
      setProcesando(null);
    }
  }

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es-CO');
    return productos.filter((producto) => {
      const coincide =
        termino.length === 0 ||
        `${producto.codigo} ${producto.nombre}`.toLocaleLowerCase('es-CO').includes(termino);
      return coincide && (!soloReorden || producto.paraReordenar);
    });
  }, [busqueda, productos, soloReorden]);

  if (productos.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu inventario está vacío"
        descripcion={puedeAdministrar
          ? 'Crea el primer producto y registra su entrada para empezar.'
          : 'No hay productos disponibles para consultar.'}
        accion={puedeAdministrar ? (
          <Link
            href={`/tienda/productos/nuevo?storeId=${encodeURIComponent(storeId)}`}
            className="inline-flex min-h-10 items-center rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            Nuevo producto
          </Link>
        ) : undefined}
      />
    );
  }

  return (
    <section aria-labelledby="titulo-inventario" className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Campo
            id="buscar-inventario"
            etiqueta="Buscar por código o nombre"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Ej. leche"
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-texto">
          <input
            type="checkbox"
            checked={soloReorden}
            onChange={(evento) => setSoloReorden(evento.target.checked)}
            className="size-4 accent-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          />
          Solo para reordenar
        </label>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-borde bg-superficie md:block">
        <table className="w-full text-left text-sm">
          <caption id="titulo-inventario" className="sr-only">
            Inventario de productos
          </caption>
          <thead className="border-b border-borde bg-fondo text-xs uppercase tracking-wide text-texto-suave">
            <tr>
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3">Producto</th>
              <th scope="col" className="px-4 py-3">Categoría</th>
              <th scope="col" className="px-4 py-3 text-right">Precio unidad (COP)</th>
              <th scope="col" className="px-4 py-3 text-right">Stock disponible</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((producto) => (
              <tr key={producto.id} className="border-b border-borde last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{producto.codigo}</td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/tienda/productos/${encodeURIComponent(producto.codigo)}?storeId=${encodeURIComponent(storeId)}`}
                    className="text-primario underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primario"
                  >
                    {producto.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3">{producto.categoria === 'perecedero' ? 'Perecedero' : 'No perecedero'}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {producto.precioUnitario === null ? '—' : producto.precioUnitario.toLocaleString('es-CO')}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{producto.stockDisponible}</td>
                <td className="px-4 py-3"><EstadoProducto producto={producto} /></td>
                <td className="px-4 py-3 text-right">
                  {puedeAdministrar && (
                  <button
                    type="button"
                    aria-label={`Ocultar ${producto.nombre} del inventario`}
                    title="Ocultar producto del inventario"
                    disabled={procesando !== null}
                    onClick={() => void ocultarProducto(producto)}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-texto-suave transition hover:bg-vencido/10 hover:text-vencido focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vencido disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {procesando === producto.codigo ? (
                      <span className="text-xs" aria-hidden="true">…</span>
                    ) : (
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2m3 0-.8 14H5.8L5 6m5 4v6m4-6v6" />
                      </svg>
                    )}
                  </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden" aria-label="Productos del inventario">
        {filtrados.map((producto) => (
          <li key={producto.id} className="rounded-xl border border-borde bg-superficie p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/tienda/productos/${encodeURIComponent(producto.codigo)}?storeId=${encodeURIComponent(storeId)}`}
                  className="font-semibold text-primario underline-offset-2 hover:underline"
                >
                  {producto.nombre}
                </Link>
                <p className="mt-1 font-mono text-xs text-texto-suave">{producto.codigo}</p>
              </div>
              <div className="flex items-center gap-2">
                <EstadoProducto producto={producto} />
                {puedeAdministrar && (
                <button
                  type="button"
                  aria-label={`Ocultar ${producto.nombre} del inventario`}
                  title="Ocultar producto del inventario"
                  disabled={procesando !== null}
                  onClick={() => void ocultarProducto(producto)}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-texto-suave transition hover:bg-vencido/10 hover:text-vencido focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vencido disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {procesando === producto.codigo ? (
                    <span className="text-xs" aria-hidden="true">…</span>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2m3 0-.8 14H5.8L5 6m5 4v6m4-6v6" />
                    </svg>
                  )}
                </button>
                )}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-texto-suave">Categoría</dt>
                <dd className="mt-1">{producto.categoria === 'perecedero' ? 'Perecedero' : 'No perecedero'}</dd>
              </div>
              <div>
                <dt className="text-texto-suave">Precio por unidad</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums">
                  {producto.precioUnitario === null
                    ? 'No registrado'
                    : `$ ${producto.precioUnitario.toLocaleString('es-CO')} COP`}
                </dd>
              </div>
              <div>
                <dt className="text-texto-suave">Stock disponible</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums">{producto.stockDisponible}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {filtrados.length === 0 && (
        <EstadoVacio
          titulo="No hay coincidencias"
          descripcion="Prueba con otro código o nombre, o desactiva el filtro de reorden."
        />
      )}
      <p className="text-right text-xs text-texto-suave">
        {filtrados.length} de {productos.length} productos
      </p>
    </section>
  );
}
