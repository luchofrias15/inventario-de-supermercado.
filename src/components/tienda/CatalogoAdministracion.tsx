'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { leerRespuestaApi } from '@/lib/clienteApi';
import type { FilaInventario } from '@/lib/datos/tipos';

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function CatalogoAdministracion({
  storeId,
  productos: productosIniciales,
}: {
  storeId: string;
  productos: FilaInventario[];
}) {
  const [productos, setProductos] = useState(productosIniciales);
  const [productoEditado, setProductoEditado] = useState<string | null>(null);
  const [precio, setPrecio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function iniciarEdicion(producto: FilaInventario) {
    setProductoEditado(producto.id);
    setPrecio(producto.precioUnitario?.toString() ?? '');
    setError('');
  }

  async function guardarPrecio(evento: FormEvent<HTMLFormElement>, producto: FilaInventario) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const respuesta = await fetch(
        `/api/tienda/productos/${encodeURIComponent(producto.codigo)}?storeId=${encodeURIComponent(storeId)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ precioUnitario: Number(precio) }),
        },
      );
      const actualizado = await leerRespuestaApi<{ precioUnitario: number }>(respuesta);
      setProductos((actuales) =>
        actuales.map((item) =>
          item.id === producto.id ? { ...item, precioUnitario: actualizado.precioUnitario } : item,
        ),
      );
      setProductoEditado(null);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo actualizar el precio.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {productos.map((producto) => (
        <li key={producto.id}>
          <Tarjeta className="relative h-full">
            <button
              type="button"
              aria-label={`Editar precio de ${producto.nombre}`}
              title="Editar precio"
              onClick={() => iniciarEdicion(producto)}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-lg border border-borde text-texto-suave hover:bg-fondo hover:text-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
                <path
                  d="m15 5 4 4M4 20l4-.8L19.6 7.6a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="pr-10 text-xs font-semibold uppercase tracking-wide text-primario">
              {producto.categoria === 'perecedero' ? 'Perecedero' : 'No perecedero'}
            </p>
            <h2 className="mt-2 text-xl font-bold">{producto.nombre}</h2>
            <p className="mt-1 font-mono text-sm text-texto-suave">{producto.codigo}</p>
            <p className="mt-4 text-sm">
              Disponibles: <strong>{producto.stockDisponible}</strong>
            </p>
            {productoEditado === producto.id ? (
              <form
                onSubmit={(evento) => guardarPrecio(evento, producto)}
                className="mt-3 space-y-3"
              >
                {error && <Aviso tipo="error">{error}</Aviso>}
                <Campo
                  id={`precio-${producto.id}`}
                  etiqueta="Precio por unidad (COP)"
                  type="number"
                  min="1"
                  max="999999999999"
                  step="1"
                  value={precio}
                  onChange={(evento) => setPrecio(evento.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Boton type="submit" cargando={guardando}>
                    Guardar
                  </Boton>
                  <Boton
                    type="button"
                    variante="secundario"
                    disabled={guardando}
                    onClick={() => {
                      setProductoEditado(null);
                      setError('');
                    }}
                  >
                    Cancelar
                  </Boton>
                </div>
              </form>
            ) : (
              <p className="mt-2 text-sm">
                Precio por unidad:{' '}
                <strong>
                  {producto.precioUnitario === null
                    ? 'No registrado'
                    : moneda.format(producto.precioUnitario)}
                </strong>
              </p>
            )}
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}
