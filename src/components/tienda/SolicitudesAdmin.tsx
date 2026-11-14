'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { leerRespuestaApi } from '@/lib/clienteApi';

interface Solicitud {
  id: string;
  full_name: string;
  email: string;
  requested_at: string;
}

export function SolicitudesAdmin() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarSolicitudes = useCallback(async () => {
    setError('');
    try {
      const respuesta = await fetch('/api/admin/solicitudes', { cache: 'no-store' });
      setSolicitudes(await leerRespuestaApi<Solicitud[]>(respuesta));
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudieron cargar las solicitudes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarSolicitudes();
  }, [cargarSolicitudes]);

  async function resolverSolicitud(solicitud: Solicitud, decision: 'approved' | 'rejected') {
    setProcesando(solicitud.id);
    setError('');
    setMensaje('');
    try {
      const respuesta = await fetch('/api/admin/solicitudes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: solicitud.id, decision }),
      });
      await leerRespuestaApi<{ id: string; decision: string }>(respuesta);
      setMensaje(
        decision === 'approved'
          ? `Se aprobó la solicitud de ${solicitud.email}.`
          : `Se rechazó la solicitud de ${solicitud.email}.`,
      );
      await cargarSolicitudes();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo resolver la solicitud.');
    } finally {
      setProcesando(null);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <Link href="/tienda" className="text-sm font-medium text-primario hover:underline">
          Volver al inventario
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Solicitudes de administrador</h1>
        <p className="mt-2 text-texto-suave">
          Aprueba o rechaza las solicitudes para administrar la página.
        </p>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {cargando ? (
        <p role="status">Cargando solicitudes…</p>
      ) : solicitudes.length === 0 ? (
        <Aviso>No hay solicitudes pendientes.</Aviso>
      ) : (
        <ul className="space-y-3">
          {solicitudes.map((solicitud) => (
            <li key={solicitud.id} className="rounded-xl border border-borde bg-superficie p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold">{solicitud.full_name || 'Sin nombre'}</h2>
                  <p className="text-sm text-texto-suave">{solicitud.email}</p>
                  <p className="mt-1 text-xs text-texto-suave">
                    Solicitud recibida: {new Date(solicitud.requested_at).toLocaleString('es-CO')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Boton
                    variante="primario"
                    cargando={procesando === solicitud.id}
                    disabled={procesando !== null}
                    onClick={() => void resolverSolicitud(solicitud, 'approved')}
                  >
                    Aprobar
                  </Boton>
                  <Boton
                    variante="fantasma"
                    disabled={procesando !== null}
                    onClick={() => void resolverSolicitud(solicitud, 'rejected')}
                  >
                    Rechazar
                  </Boton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
