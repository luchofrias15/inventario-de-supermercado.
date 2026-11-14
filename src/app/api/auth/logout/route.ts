import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase-config';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  let revokeError: string | undefined;

  if (accessToken) {
    try {
      const config = getSupabaseConfig();
      const result = await fetch(`${config.url}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: config.apiKey,
          authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });
      if (!result.ok) revokeError = 'No se pudo revocar la sesion remota';
    } catch {
      revokeError = 'No se pudo conectar con Supabase Auth para cerrar la sesion';
    }
  }

  const response = NextResponse.json(
    revokeError ? { success: false, error: revokeError } : { success: true },
    { status: revokeError ? 502 : 200 },
  );
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  response.cookies.delete('market_session');
  return response;
}
