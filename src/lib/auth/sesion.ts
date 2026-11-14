import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

const COOKIE_ACCESO = 'sb-access-token';

interface UsuarioSupabase {
  email?: unknown;
}

export async function obtenerSesion(): Promise<{ email: string } | null> {
  const token = (await cookies()).get(COOKIE_ACCESO)?.value;
  if (!token) return null;

  const config = getSupabaseConfig();
  let response: Response;
  try {
    response = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        apikey: config.apiKey,
        authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error('No se pudo validar la sesión con Supabase Auth.', { cause: error });
  }

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error(`Supabase Auth no pudo validar la sesión (HTTP ${response.status}).`);
  }

  const user = (await response.json()) as UsuarioSupabase;
  if (typeof user.email !== 'string' || user.email.length === 0) return null;
  return { email: user.email };
}

export async function exigirSesion(): Promise<{ email: string }> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorDeNegocio('NO_AUTORIZADO');
  return sesion;
}
