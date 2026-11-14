'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { leerRespuestaApi } from '@/lib/clienteApi';
import type { DatosProducto } from '@/lib/datos/tipos';
import type { Categoria } from '@/lib/reglas/producto';

interface ProductoCreado {
  id: string;
  codigo: string;
}

export function FormularioProducto() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState('');

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError('');

    const formulario = new FormData(evento.currentTarget);
    const categoriaFormulario = formulario.get('categoria');
    const categoria: Categoria =
      categoriaFormulario === 'no_perecedero' ? 'no_perecedero' : 'perecedero';
    const datos: DatosProducto = {
      codigo: String(formulario.get('codigo') ?? '').trim(),
      nombre: String(formulario.get('nombre') ?? '').trim(),
      categoria,
      proveedor: String(formulario.get('proveedor') ?? '').trim() || undefined,
    };

    try {
      const respuesta = await fetch('/api/tienda/productos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const producto = await leerRespuestaApi<ProductoCreado>(respuesta);
      setCodigo(producto.codigo);
      router.push(`/tienda/productos/${encodeURIComponent(producto.codigo)}`);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo crear el producto.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {codigo && <p className="sr-only" role="status">Producto {codigo} creado.</p>}
      <Campo
        id="producto-codigo"
        name="codigo"
        etiqueta="Código"
        autoComplete="off"
        maxLength={40}
        required
      />
      <Campo
        id="producto-nombre"
        name="nombre"
        etiqueta="Nombre"
        autoComplete="off"
        maxLength={160}
        required
      />
      <Selector id="producto-categoria" name="categoria" etiqueta="Categoría" defaultValue="perecedero">
        <option value="perecedero">Perecedero</option>
        <option value="no_perecedero">No perecedero</option>
      </Selector>
      <Campo
        id="producto-proveedor"
        name="proveedor"
        etiqueta="Proveedor (opcional)"
        autoComplete="organization"
        maxLength={120}
      />
      <Boton type="submit" cargando={cargando}>
        {cargando ? 'Guardando…' : 'Crear producto'}
      </Boton>
    </form>
  );
}
