'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { ErrorApi, leerRespuestaApi } from '@/lib/clienteApi';
import type { FilaInventario, ResultadoSalida } from '@/lib/datos/tipos';

export function FormularioVenta({ productos }: { productos: FilaInventario[] }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const producto = useMemo(
    () => productos.find((item) => item.codigo === codigo),
    [codigo, productos],
  );

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');
    const cantidad = Number(new FormData(evento.currentTarget).get('cantidad'));

    try {
      const respuesta = await fetch('/api/tienda/salidas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ codigo, cantidad }),
      });
      const salida = await leerRespuestaApi<ResultadoSalida>(respuesta);
      setMensaje(
        salida.paraReordenar
          ? `Venta registrada. Stock: ${salida.stock}. ${producto?.nombre ?? codigo}: quedan ${salida.stock} unidades (punto de reorden: 10).`
          : `Venta registrada. Nuevo stock: ${salida.stock} unidades.`,
      );
      router.refresh();
    } catch (causa) {
      if (causa instanceof ErrorApi && causa.codigo === 'STOCK_INSUFICIENTE') {
        const detalles = causa.detalles;
        const disponible =
          typeof detalles === 'object' &&
          detalles !== null &&
          'disponible' in detalles &&
          typeof detalles.disponible === 'number'
            ? detalles.disponible
            : producto?.stockDisponible;
        setError(
          `No hay stock suficiente de ${producto?.nombre ?? codigo}: disponible ${disponible ?? 0}.`,
        );
      } else {
        setError(causa instanceof Error ? causa.message : 'No se pudo registrar la venta.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      <Selector
        id="venta-producto"
        etiqueta="Producto"
        value={codigo}
        onChange={(evento) => setCodigo(evento.target.value)}
        required
      >
        <option value="">Selecciona un producto</option>
        {productos.map((item) => (
          <option key={item.id} value={item.codigo}>
            {item.codigo} · {item.nombre}
          </option>
        ))}
      </Selector>
      {producto && (
        <Aviso tipo={producto.paraReordenar ? 'advertencia' : 'info'}>
          Stock disponible de {producto.nombre}: <strong>{producto.stockDisponible}</strong> unidades.
        </Aviso>
      )}
      <Campo
        id="venta-cantidad"
        name="cantidad"
        etiqueta="Cantidad"
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        required
      />
      <Boton type="submit" cargando={cargando} disabled={!producto}>
        {cargando ? 'Registrando…' : 'Registrar venta'}
      </Boton>
    </form>
  );
}
