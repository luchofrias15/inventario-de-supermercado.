import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/auth/sesion';
import { NavegacionTienda } from '@/components/tienda/NavegacionTienda';

export default async function LayoutTienda({ children }: { children: ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');

  return (
    <div className="tienda-shell text-texto">
      <NavegacionTienda email={sesion.email} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
