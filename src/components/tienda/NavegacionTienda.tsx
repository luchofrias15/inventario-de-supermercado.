'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Aviso } from '@/components/ui/Aviso';
import { leerRespuestaApi } from '@/lib/clienteApi';
import type { RolUsuario } from '@/lib/auth/sesion';

const ENLACES = [
  { href: '/tienda', etiqueta: 'Inventario' },
  { href: '/tienda/entrada', etiqueta: 'Entrada' },
  { href: '/tienda/venta', etiqueta: 'Venta' },
  { href: '/tienda/vencimientos', etiqueta: 'Vencimientos' },
  { href: '/tienda/rotacion', etiqueta: 'Rotación' },
  { href: '/tienda/tiendas', etiqueta: 'Tiendas' },
  { href: '/tienda/pedidos', etiqueta: 'Pedidos' },
];

export function NavegacionTienda({
  email,
  role,
  storeId,
}: {
  email: string;
  role: RolUsuario;
  storeId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedStoreId = role === 'admin'
    ? searchParams.get('storeId') ?? storeId
    : storeId;
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  const [errorSolicitudes, setErrorSolicitudes] = useState('');

  useEffect(() => {
    if (role !== 'admin') return;

    let active = true;
    async function cargarSolicitudes() {
      try {
        const respuesta = await fetch('/api/admin/solicitudes', { cache: 'no-store' });
        const solicitudes = await leerRespuestaApi<{ id: string }[]>(respuesta);
        if (active) {
          setSolicitudesPendientes(solicitudes.length);
          setErrorSolicitudes('');
        }
      } catch (causa) {
        if (active) {
          setErrorSolicitudes(
            causa instanceof Error ? causa.message : 'No se pudieron cargar las solicitudes.',
          );
        }
      }
    }

    void cargarSolicitudes();
    const intervalId = window.setInterval(() => void cargarSolicitudes(), 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [role]);

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
          <Link href="/tienda/tiendas" className="text-lg font-bold text-primario">
            Mi Tienda
          </Link>
          <nav aria-label="Navegación principal" className="order-3 flex w-full gap-2 sm:order-none sm:w-auto">
            {ENLACES.filter(({ href }) => (
              role !== 'user' || href === '/tienda/tiendas' || href === '/tienda/pedidos'
            )).map(({ href, etiqueta }) => {
              const target = role !== 'user' && selectedStoreId
                ? `${href}?storeId=${encodeURIComponent(selectedStoreId)}`
                : href;
              return (
                <Link
                  key={href}
                  href={target}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-texto-suave transition hover:bg-primario-suave hover:text-primario focus-visible:outline-2 focus-visible:outline-primario"
                >
                  {etiqueta}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <Link
                href="/tienda/solicitudes"
                aria-label={`Solicitudes de administrador: ${solicitudesPendientes} pendientes`}
                title={errorSolicitudes || `${solicitudesPendientes} solicitudes pendientes`}
                className="relative inline-flex size-9 items-center justify-center rounded-full text-xl hover:bg-primario-suave focus-visible:outline-2 focus-visible:outline-primario"
              >
                <span aria-hidden="true">🔔</span>
                {solicitudesPendientes > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-vencido px-1 text-center text-xs font-bold text-white">
                    {solicitudesPendientes}
                  </span>
                )}
              </Link>
            )}
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
      {errorSolicitudes && role === 'admin' && (
        <p className="sr-only" role="status">{errorSolicitudes}</p>
      )}
    </>
  );
}
