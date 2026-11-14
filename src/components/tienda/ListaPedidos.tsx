'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import type {
  EstadoPedido,
  FilaInventario,
  MetodoPagoPedido,
  Pedido,
} from '@/lib/datos/tipos';
import { leerRespuestaApi } from '@/lib/clienteApi';

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const estadoTexto: Record<EstadoPedido, string> = {
  pending: 'Pendiente de aceptación',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

interface BorradorPedido {
  pedidoId: string;
  cantidades: Record<string, number>;
  nombre: string;
  telefono: string;
  direccion: string;
  barrio: string;
  instrucciones: string;
  metodoPago: MetodoPagoPedido;
}

export function ListaPedidos({
  pedidos,
  puedeGestionar,
  storeId,
  productosPorTienda = {},
}: {
  pedidos: Pedido[];
  puedeGestionar: boolean;
  storeId?: string;
  productosPorTienda?: Record<string, FilaInventario[]>;
}) {
  const router = useRouter();
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [borrador, setBorrador] = useState<BorradorPedido | null>(null);

  async function revisar(id: string, decision: 'accepted' | 'rejected') {
    if (!storeId) return;
    setProcesando(id);
    setError('');
    try {
      const respuesta = await fetch(
        `/api/tienda/pedidos?storeId=${encodeURIComponent(storeId)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, decision }),
        },
      );
      await leerRespuestaApi<{ id: string }>(respuesta);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo actualizar el pedido.');
    } finally {
      setProcesando(null);
    }
  }

  function iniciarEdicion(pedido: Pedido) {
    setError('');
    setBorrador({
      pedidoId: pedido.id,
      cantidades: Object.fromEntries(pedido.items.map((item) => [item.productId, item.cantidad])),
      nombre: pedido.nombreCliente,
      telefono: pedido.telefonoCliente,
      direccion: pedido.direccion,
      barrio: pedido.barrio,
      instrucciones: pedido.instrucciones,
      metodoPago: pedido.metodoPago,
    });
  }

  async function cancelar(id: string) {
    if (!window.confirm('¿Quieres cancelar este pedido?')) return;
    setProcesando(id);
    setError('');
    try {
      const respuesta = await fetch('/api/tienda/pedidos', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pedidoId: id }),
      });
      await leerRespuestaApi<{ id: string }>(respuesta);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cancelar el pedido.');
    } finally {
      setProcesando(null);
    }
  }

  async function guardarEdicion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!borrador) return;
    setProcesando(borrador.pedidoId);
    setError('');
    const formulario = new FormData(evento.currentTarget);
    const productosDisponibles = new Map(
      (productosPorTienda[pedidos.find((pedido) => pedido.id === borrador.pedidoId)?.storeId ?? ''] ?? [])
        .filter((producto) => producto.precioUnitario !== null && producto.stockDisponible > 0)
        .map((producto) => [producto.id, producto]),
    );
    try {
      const respuesta = await fetch('/api/tienda/pedidos', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pedidoId: borrador.pedidoId,
          items: Object.entries(borrador.cantidades)
            .filter(([productId, cantidad]) => cantidad > 0 && productosDisponibles.has(productId))
            .map(([productId, cantidad]) => ({ productId, cantidad })),
          nombre: String(formulario.get('nombre') ?? ''),
          telefono: String(formulario.get('telefono') ?? ''),
          direccion: String(formulario.get('direccion') ?? ''),
          barrio: String(formulario.get('barrio') ?? ''),
          instrucciones: String(formulario.get('instrucciones') ?? ''),
          metodoPago: borrador.metodoPago,
        }),
      });
      await leerRespuestaApi<{ id: string }>(respuesta);
      setBorrador(null);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo guardar el pedido.');
    } finally {
      setProcesando(null);
    }
  }

  if (pedidos.length === 0) {
    return <Aviso>{puedeGestionar ? 'Todavía no han llegado pedidos.' : 'Todavía no tienes pedidos.'}</Aviso>;
  }

  return (
    <div className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {pedidos.map((pedido) => (
        <article key={pedido.id} className="rounded-xl border border-borde bg-superficie p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="break-all font-mono text-xs text-texto-suave">Pedido {pedido.id}</p>
              <h2 className="mt-1 text-lg font-bold">{pedido.tienda}</h2>
              <p className="mt-1 text-sm text-texto-suave">
                {new Intl.DateTimeFormat('es-CO', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(pedido.creadoEn))}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
              pedido.estado === 'pending'
                ? 'bg-amber-100 text-amber-900'
                : pedido.estado === 'accepted'
                  ? 'bg-green-100 text-green-900'
                  : 'bg-red-100 text-red-900'
            }`}>
              {estadoTexto[pedido.estado]}
            </span>
          </div>

          {!puedeGestionar && pedido.estado === 'pending' && (
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={procesando !== null}
                  onClick={() => void cancelar(pedido.id)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {procesando === pedido.id ? 'Procesando…' : 'Cancelar pedido'}
                </button>
                <button
                  type="button"
                  disabled={procesando !== null}
                  onClick={() => iniciarEdicion(pedido)}
                  className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  Editar pedido
                </button>
            </div>
          )}

          {puedeGestionar && (
            <div className="mt-4 rounded-lg bg-fondo p-3 text-sm">
              <p><strong>Cliente:</strong> {pedido.nombreCliente} ({pedido.correoCliente})</p>
              <p><strong>Teléfono:</strong> {pedido.telefonoCliente}</p>
              <p><strong>Dirección:</strong> {pedido.direccion}, barrio {pedido.barrio}</p>
              {pedido.instrucciones && <p><strong>Instrucciones:</strong> {pedido.instrucciones}</p>}
            </div>
          )}

          <ul className="mt-4 divide-y divide-borde">
            {pedido.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3 py-2 text-sm">
                <span>{item.cantidad} × {item.nombre}</span>
                <strong>{moneda.format(item.total)}</strong>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-borde pt-3">
            <div className="text-sm">
              <p>
                Pago:{' '}
                <strong>
                  {pedido.metodoPago === 'efectivo'
                    ? 'Efectivo al recibir'
                    : 'Transferencia (confirmación manual)'}
                </strong>
              </p>
              {pedido.metodoPago === 'transferencia' && (
                <p className="mt-1 text-xs text-texto-suave">
                  Coordina los datos de transferencia con el cliente.
                </p>
              )}
              <p className="mt-1 text-xs text-texto-suave">El domicilio se coordina por separado.</p>
            </div>
            <p className="text-right">
              <span className="block text-xs text-texto-suave">Subtotal de productos</span>
              <strong className="text-lg">{moneda.format(pedido.subtotal)}</strong>
            </p>
          </div>

          {puedeGestionar && pedido.estado === 'pending' && (
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Boton
                type="button"
                variante="fantasma"
                disabled={procesando !== null}
                cargando={procesando === pedido.id}
                onClick={() => void revisar(pedido.id, 'rejected')}
              >
                Rechazar
              </Boton>
              <Boton
                type="button"
                disabled={procesando !== null}
                cargando={procesando === pedido.id}
                onClick={() => void revisar(pedido.id, 'accepted')}
              >
                Aceptar y descontar stock
              </Boton>
            </div>
          )}

          {borrador?.pedidoId === pedido.id && (
            <form onSubmit={guardarEdicion} className="mt-5 space-y-4 border-t border-borde pt-5">
              {error && <Aviso tipo="error">{error}</Aviso>}
              <h3 className="text-lg font-bold text-blue-700">Editar pedido</h3>
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">Productos y cantidades</legend>
                {(productosPorTienda[pedido.storeId] ?? []).map((producto) => (
                  <label key={producto.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <strong>{producto.nombre}</strong>
                      <span className="block text-xs text-texto-suave">
                        {producto.precioUnitario === null
                          ? 'Precio no disponible'
                          : `${moneda.format(producto.precioUnitario)} · ${producto.stockDisponible} disponibles`}
                      </span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={producto.stockDisponible}
                      value={borrador.cantidades[producto.id] ?? 0}
                      disabled={producto.precioUnitario === null}
                      onChange={(evento) => {
                        const cantidad = Number(evento.target.value);
                        setBorrador((actual) => actual
                          ? {
                              ...actual,
                              cantidades: {
                                ...actual.cantidades,
                                [producto.id]: Number.isInteger(cantidad)
                                  ? Math.min(producto.stockDisponible, Math.max(0, cantidad))
                                  : 0,
                              },
                            }
                          : actual);
                      }}
                      className="h-10 w-20 rounded-md border border-borde px-2 text-right"
                      aria-label={`Cantidad de ${producto.nombre}`}
                    />
                  </label>
                ))}
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Método de pago</legend>
                <label className="flex gap-2 text-sm">
                  <input
                    type="radio"
                    name={`metodo-pago-${pedido.id}`}
                    checked={borrador.metodoPago === 'efectivo'}
                    onChange={() => setBorrador({ ...borrador, metodoPago: 'efectivo' })}
                  />
                  Efectivo al recibir
                </label>
                <label className="flex gap-2 text-sm">
                  <input
                    type="radio"
                    name={`metodo-pago-${pedido.id}`}
                    checked={borrador.metodoPago === 'transferencia'}
                    onChange={() => setBorrador({ ...borrador, metodoPago: 'transferencia' })}
                  />
                  Transferencia
                </label>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo
                  id={`editar-nombre-${pedido.id}`}
                  name="nombre"
                  etiqueta="Nombre"
                  value={borrador.nombre}
                  onChange={(evento) => setBorrador({ ...borrador, nombre: evento.target.value })}
                  maxLength={120}
                  required
                />
                <Campo
                  id={`editar-telefono-${pedido.id}`}
                  name="telefono"
                  etiqueta="Teléfono"
                  type="tel"
                  value={borrador.telefono}
                  onChange={(evento) => setBorrador({ ...borrador, telefono: evento.target.value })}
                  maxLength={30}
                  required
                />
                <Campo
                  id={`editar-direccion-${pedido.id}`}
                  name="direccion"
                  etiqueta="Dirección"
                  value={borrador.direccion}
                  onChange={(evento) => setBorrador({ ...borrador, direccion: evento.target.value })}
                  maxLength={240}
                  required
                />
                <Campo
                  id={`editar-barrio-${pedido.id}`}
                  name="barrio"
                  etiqueta="Barrio"
                  value={borrador.barrio}
                  onChange={(evento) => setBorrador({ ...borrador, barrio: evento.target.value })}
                  maxLength={120}
                  required
                />
                <Campo
                  id={`editar-instrucciones-${pedido.id}`}
                  name="instrucciones"
                  etiqueta="Instrucciones (opcional)"
                  value={borrador.instrucciones}
                  onChange={(evento) => setBorrador({ ...borrador, instrucciones: evento.target.value })}
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Boton type="button" variante="fantasma" onClick={() => setBorrador(null)}>
                  Cerrar
                </Boton>
                <Boton type="submit" disabled={procesando !== null}>
                  {procesando === pedido.id ? 'Guardando…' : 'Guardar cambios'}
                </Boton>
              </div>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
