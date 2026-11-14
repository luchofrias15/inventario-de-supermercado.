import { redirect } from 'next/navigation';
import { SolicitudesAdmin } from '@/components/tienda/SolicitudesAdmin';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function SolicitudesAdminPage() {
  const sesion = await exigirSesion();
  if (sesion.role !== 'admin') redirect('/tienda');
  return <SolicitudesAdmin />;
}
