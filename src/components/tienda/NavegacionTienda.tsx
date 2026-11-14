'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Aviso } from '@/components/ui/Aviso';

const ENLACES = [
  { href: '/tienda', etiqueta: 'Inventario' },
  { href: '/tienda/entrada', etiqueta: 'Entrada' },
  { href: '/tienda/venta', etiqueta: 'Venta' },
];

export function NavegacionTienda({ email }: { email: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function cerrarSesion() {
    setCargando(true);
    setError('');
    try {
      const respuesta = await fetch('/api/auth/logout', { method: 'POST' });
      if (!respuesta.ok) throw new Error('No se pudo cerrar completamente la sesión.');
      router.replace('/login');
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cerrar la sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <header className="border-b border-borde bg-superficie">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/tienda" className="text-lg font-bold text-primario">
            Mi Tienda
          </Link>
          <nav aria-label="Navegación principal" className="order-3 flex w-full gap-2 sm:order-none sm:w-auto">
            {ENLACES.map(({ href, etiqueta }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-texto-suave transition hover:bg-primario-suave hover:text-primario focus-visible:outline-2 focus-visible:outline-primario"
              >
                {etiqueta}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-texto-suave md:inline">{email}</span>
            <Boton variante="fantasma" cargando={cargando} onClick={cerrarSesion}>
              {cargando ? 'Cerrando…' : 'Cerrar sesión'}
            </Boton>
          </div>
        </div>
      </header>
      {error && (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}
    </>
  );
}
