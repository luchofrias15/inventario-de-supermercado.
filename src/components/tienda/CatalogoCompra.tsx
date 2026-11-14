'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { leerRespuestaApi } from '@/lib/clienteApi';
import type { FilaInventario, MetodoPagoPedido } from '@/lib/datos/tipos';

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function CatalogoCompra({
  storeId,
  productos,
}: {
  storeId: string;
  productos: FilaInventario[];
}) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoPedido>('efectivo');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState<string | null>(null);

  const productosCarrito = productos.flatMap((producto) => {
    const cantidad = cantidades[producto.id] ?? 0;
    return cantidad > 0 && producto.precioUnitario !== null
      ? [{ producto, cantidad, total: producto.precioUnitario * cantidad }]
      : [];
  });
  const unidades = productosCarrito.reduce((total, item) => total + item.cantidad, 0);
  const subtotal = productosCarrito.reduce((total, item) => total + item.total, 0);

  function cambiarCantidad(producto: FilaInventario, cambio: number) {
    setCantidades((actuales) => {
      const actual = actuales[producto.id] ?? 0;
      const cantidad = Math.max(0, Math.min(producto.stockDisponible, actual + cambio));
      return { ...actuales, [producto.id]: cantidad };
    });
  }

  async function enviarPedido(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError('');
    const formulario = new FormData(evento.currentTarget);
    try {
      const respuesta = await fetch(
        `/api/tienda/pedidos?storeId=${encodeURIComponent(storeId)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            items: productosCarrito.map(({ producto, cantidad }) => ({
              productId: producto.id,
              cantidad,
            })),
            nombre: String(formulario.get('nombre') ?? ''),
            telefono: String(formulario.get('telefono') ?? ''),
            direccion: String(formulario.get('direccion') ?? ''),
            barrio: String(formulario.get('barrio') ?? ''),
            instrucciones: String(formulario.get('instrucciones') ?? ''),
            metodoPago,
          }),
        },
      );
      const pedido = await leerRespuestaApi<{ id: string }>(respuesta);
      setPedidoCreado(pedido.id);
      setCantidades({});
      setFinalizando(false);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo enviar el pedido.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {productos.map((producto) => {
          const sinPrecio = producto.precioUnitario === null;
          const sinStock = producto.stockDisponible < 1;
          return (
            <li key={producto.id}>
              <Tarjeta className="flex h-full flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-primario">
                  {producto.categoria === 'perecedero' ? 'Perecedero' : 'No perecedero'}
                </p>
                <h2 className="mt-2 text-xl font-bold">{producto.nombre}</h2>
                <p className="mt-1 font-mono text-sm text-texto-suave">{producto.codigo}</p>
                {producto.proveedor && (
                  <p className="mt-3 text-sm text-texto-suave">{producto.proveedor}</p>
                )}
                <p className="mt-4 text-sm">
                  Disponibles: <strong>{producto.stockDisponible}</strong>
                </p>
                <p className="mt-2 text-sm">
                  Precio por unidad:{' '}
                  <strong>
                    {producto.precioUnitario === null
                      ? 'No registrado'
                      : moneda.format(producto.precioUnitario)}
                  </strong>
                </p>
                <div className="mt-auto pt-4">
                  {cantidades[producto.id] ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm">Cantidad: {cantidades[producto.id]}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label={`Quitar una unidad de ${producto.nombre}`}
                          onClick={() => cambiarCantidad(producto, -1)}
                          className="size-10 rounded-lg border border-borde text-lg font-bold"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          aria-label={`Agregar una unidad de ${producto.nombre}`}
                          disabled={cantidades[producto.id]! >= producto.stockDisponible}
                          onClick={() => cambiarCantidad(producto, 1)}
                          className="size-10 rounded-lg border border-borde text-lg font-bold disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={sinPrecio || sinStock}
                      onClick={() => cambiarCantidad(producto, 1)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white hover:bg-primario/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sinPrecio ? 'Precio no disponible' : sinStock ? 'Agotado' : 'Agregar al carrito'}
                    </button>
                  )}
                </div>
              </Tarjeta>
            </li>
          );
        })}
      </ul>

      <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
        {carritoAbierto && (
          <section
            aria-label="Carrito de compras"
            className="mb-3 max-h-[78vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-borde bg-superficie p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{pedidoCreado ? 'Pedido enviado' : 'Tu carrito'}</h2>
              <button
                type="button"
                aria-label="Cerrar carrito"
                onClick={() => setCarritoAbierto(false)}
                className="size-9 rounded-lg border border-borde text-lg"
              >
                ×
              </button>
            </div>
            {pedidoCreado ? (
              <div className="mt-4 space-y-3">
                <Aviso>Pedido registrado como pendiente. La tienda confirmará disponibilidad y coordinará el domicilio.</Aviso>
                <p className="break-all text-xs text-texto-suave">Número de pedido: {pedidoCreado}</p>
                <Link href="/tienda/pedidos" className="font-semibold text-primario underline">
                  Ver mis pedidos
                </Link>
              </div>
            ) : finalizando ? (
              <form onSubmit={enviarPedido} className="mt-4 space-y-4">
                {error && <Aviso tipo="error">{error}</Aviso>}
                <section aria-label="Resumen de productos" className="space-y-3">
                  <h3 className="text-sm font-semibold">Productos que vas a comprar</h3>
                  <ul className="space-y-3">
                    {productosCarrito.map(({ producto, cantidad, total }) => (
                      <li key={producto.id} className="flex justify-between gap-3 text-sm">
                        <div>
                          <p className="font-semibold">{producto.nombre}</p>
                          <p className="text-texto-suave">
                            {cantidad} × {moneda.format(producto.precioUnitario!)}
                          </p>
                        </div>
                        <strong className="text-right">{moneda.format(total)}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="flex justify-between border-t border-borde pt-3 text-sm">
                    <span>Total de productos</span>
                    <strong>{moneda.format(subtotal)}</strong>
                  </p>
                  <p className="text-xs text-texto-suave">
                    El valor del domicilio lo confirmará la tienda.
                  </p>
                </section>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold">Método de pago</legend>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="efectivo"
                      checked={metodoPago === 'efectivo'}
                      onChange={() => setMetodoPago('efectivo')}
                    />
                    Efectivo al recibir el domicilio
                  </label>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="transferencia"
                      checked={metodoPago === 'transferencia'}
                      onChange={() => setMetodoPago('transferencia')}
                    />
                    Transferencia (confirmación manual)
                  </label>
                </fieldset>
                <p className="text-xs text-texto-suave">
                  {metodoPago === 'transferencia'
                    ? 'La tienda coordinará contigo los datos para realizar la transferencia.'
                    : 'Paga en efectivo al recibir el pedido.'}
                </p>
                <h3 className="border-t border-borde pt-4 text-sm font-semibold">
                  Datos para el domicilio
                </h3>
                <Campo id="pedido-nombre" name="nombre" etiqueta="Nombre" autoComplete="name" maxLength={120} required />
                <Campo id="pedido-telefono" name="telefono" etiqueta="Teléfono" type="tel" autoComplete="tel" maxLength={30} required />
                <Campo id="pedido-direccion" name="direccion" etiqueta="Dirección" autoComplete="street-address" maxLength={240} required />
                <Campo id="pedido-barrio" name="barrio" etiqueta="Barrio" maxLength={120} required />
                <Campo id="pedido-instrucciones" name="instrucciones" etiqueta="Instrucciones (opcional)" maxLength={500} />
                <Boton type="submit" cargando={cargando} className="w-full">
                  {cargando ? 'Enviando pedido…' : 'Enviar pedido'}
                </Boton>
              </form>
            ) : productosCarrito.length === 0 ? (
              <p className="mt-4 text-sm text-texto-suave">Todavía no agregas productos.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <ul className="space-y-3">
                  {productosCarrito.map(({ producto, cantidad, total }) => (
                    <li key={producto.id} className="flex justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold">{producto.nombre}</p>
                        <p className="text-texto-suave">{cantidad} × {moneda.format(producto.precioUnitario!)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{moneda.format(total)}</p>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(producto, -cantidad)}
                          className="text-xs text-vencido underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="space-y-1 border-t border-borde pt-3">
                  <p className="flex justify-between text-sm">
                    <span>Subtotal productos</span><strong>{moneda.format(subtotal)}</strong>
                  </p>
                  <p className="text-xs text-texto-suave">Domicilio por confirmar con la tienda.</p>
                </div>
                <Boton type="button" className="w-full" onClick={() => setFinalizando(true)}>
                  Continuar al pago
                </Boton>
              </div>
            )}
          </section>
        )}
        <button
          type="button"
          aria-expanded={carritoAbierto}
          aria-label={pedidoCreado
            ? 'Ver confirmación del pedido'
            : `Abrir carrito: ${unidades} productos, ${moneda.format(subtotal)}`}
          onClick={() => setCarritoAbierto((abierto) => !abierto)}
          className="relative ml-auto flex size-16 flex-col items-center justify-center rounded-full bg-primario text-white shadow-xl hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          {pedidoCreado ? (
            <span className="text-sm font-semibold">✓</span>
          ) : (
            <>
              <span aria-hidden="true" className="text-2xl leading-none">🛒</span>
              <span className="mt-1 max-w-[3.5rem] truncate text-[10px] font-semibold leading-none">
                {moneda.format(subtotal)}
              </span>
              {unidades > 0 && (
                <span className="absolute right-1 top-0 inline-flex size-5 items-center justify-center rounded-full border-2 border-superficie bg-vencido text-[10px] font-bold text-white">
                  {unidades > 99 ? '99+' : unidades}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  );
}
