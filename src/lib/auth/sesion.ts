import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

const COOKIE_ACCESO = 'sb-access-token';

export type RolUsuario = 'admin' | 'store_admin' | 'user';

export interface SesionUsuario {
  id: string;
  email: string;
  role: RolUsuario;
  storeId: string | null;
}

interface UsuarioSupabase {
  id?: unknown;
  email?: unknown;
}

interface PerfilSupabase {
  role?: unknown;
  store_id?: unknown;
}

function esRolUsuario(value: unknown): value is RolUsuario {
  return value === 'admin' || value === 'store_admin' || value === 'user';
}

export async function obtenerTokenSesion(): Promise<string | null> {
  return (await cookies()).get(COOKIE_ACCESO)?.value ?? null;
}

export async function obtenerSesion(): Promise<SesionUsuario | null> {
  const token = await obtenerTokenSesion();
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
  if (typeof user.id !== 'string' || typeof user.email !== 'string' || user.email.length === 0) {
    return null;
  }

  let profileResponse: Response;
  try {
    profileResponse = await fetch(
      `${config.url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,store_id`,
      {
        headers: {
          apikey: config.apiKey,
          authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    );
  } catch (error) {
    throw new Error('No se pudo cargar el perfil de la sesión.', { cause: error });
  }

  if (profileResponse.status === 401 || profileResponse.status === 403) return null;
  if (!profileResponse.ok) {
    throw new Error(`Supabase no pudo cargar el perfil (HTTP ${profileResponse.status}).`);
  }

  const profiles = (await profileResponse.json()) as PerfilSupabase[];
  const profile = profiles[0];
  if (!profile || !esRolUsuario(profile.role)) return null;

  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    storeId: typeof profile.store_id === 'string' ? profile.store_id : null,
  };
}

export async function exigirSesion(): Promise<SesionUsuario> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorDeNegocio('NO_AUTORIZADO');
  return sesion;
}

export function exigirAdministradorTienda(sesion: SesionUsuario): string {
  if (sesion.role !== 'admin' && sesion.role !== 'store_admin') {
    throw new ErrorDeNegocio('PERMISO_DENEGADO');
  }
  if (!sesion.storeId) {
    throw new Error('El perfil no tiene una tienda asignada. Aplica la migración de roles y tiendas.');
  }
  return sesion.storeId;
}

export function exigirAdminPagina(sesion: SesionUsuario): void {
  if (sesion.role !== 'admin') throw new ErrorDeNegocio('PERMISO_DENEGADO');
}

export function alcanceDeTienda(sesion: SesionUsuario): string | undefined {
  return sesion.role === 'user' ? undefined : sesion.storeId ?? undefined;
}
