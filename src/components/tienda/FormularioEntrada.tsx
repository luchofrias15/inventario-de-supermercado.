'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { leerRespuestaApi } from '@/lib/clienteApi';
import type { FilaInventario } from '@/lib/datos/tipos';

interface EntradaCreada {
  stock: number;
}

interface FormularioEntradaProps {
  productos: FilaInventario[];
  fechaHoy: string;
  storeId: string;
}

export function FormularioEntrada({ productos, fechaHoy, storeId }: FormularioEntradaProps) {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [fechaEntrada, setFechaEntrada] = useState(fechaHoy);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const producto = useMemo(
    () => productos.find((item) => item.codigo === codigo),
    [codigo, productos],
  );

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');

    const formulario = new FormData(evento.currentTarget);
    const datos = {
      codigo,
      cantidad: Number(formulario.get('cantidad')),
      fechaEntrada,
      ...(producto?.categoria === 'perecedero'
        ? { fechaVencimiento: String(formulario.get('fechaVencimiento') ?? '') }
        : {}),
    };

    try {
      const respuesta = await fetch(
        `/api/tienda/entradas?storeId=${encodeURIComponent(storeId)}`,
        {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(datos),
        },
      );
      const entrada = await leerRespuestaApi<EntradaCreada>(respuesta);
      setMensaje(`Entrada registrada. Stock disponible: ${entrada.stock} unidades.`);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo registrar la entrada.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      <Selector
        id="entrada-producto"
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
      <Campo
        id="entrada-cantidad"
        name="cantidad"
        etiqueta="Cantidad"
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        required
      />
      <Campo
        id="entrada-fecha"
        name="fechaEntrada"
        etiqueta="Fecha de entrada"
        type="date"
        value={fechaEntrada}
        onChange={(evento) => setFechaEntrada(evento.target.value)}
        required
      />
      {producto?.categoria === 'perecedero' && (
        <Campo
          id="entrada-vencimiento"
          name="fechaVencimiento"
          etiqueta="Fecha de vencimiento"
          type="date"
          min={fechaEntrada}
          required
        />
      )}
      {!producto && <p className="text-sm text-texto-suave">Selecciona un producto para continuar.</p>}
      <Boton type="submit" cargando={cargando} disabled={!producto}>
        {cargando ? 'Registrando…' : 'Registrar entrada'}
      </Boton>
    </form>
  );
}
