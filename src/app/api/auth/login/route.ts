import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseConfig } from '@/lib/supabase-config';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(1024),
});

interface SupabaseTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  };
}

interface SupabaseProfile {
  full_name: string;
  role: 'admin' | 'store_admin' | 'user';
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Solicitud invalida' }, { status: 400 });
    }
    throw error;
  }

  const input = loginSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ error: 'Correo o contrasena invalidos' }, { status: 400 });
  }

  let config;
  try {
    config = getSupabaseConfig();
  } catch {
    return NextResponse.json({ error: 'La autenticacion de Supabase no esta configurada' }, { status: 503 });
  }

  let authResponse: Response;
  try {
    authResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: config.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(input.data),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con Supabase Auth' }, { status: 502 });
  }

  if (!authResponse.ok) {
    if (authResponse.status === 429) {
      return NextResponse.json({ error: 'Demasiados intentos; intenta de nuevo mas tarde' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
  }

  const session = (await authResponse.json()) as SupabaseTokenResponse;
  if (!session.access_token || !session.refresh_token || !session.user?.id) {
    return NextResponse.json({ error: 'Supabase devolvio una sesion incompleta' }, { status: 502 });
  }

  let profile: SupabaseProfile;
  try {
    const profileResponse = await fetch(
      `${config.url}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=full_name,role`,
      {
        headers: {
          apikey: config.apiKey,
          authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      },
    );
    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'No se pudo cargar el perfil del usuario' }, { status: 502 });
    }

    const profiles = (await profileResponse.json()) as SupabaseProfile[];
    if (!profiles[0]) {
      return NextResponse.json({ error: 'El perfil del usuario aun no existe en Supabase' }, { status: 403 });
    }
    profile = profiles[0];
  } catch {
    return NextResponse.json({ error: 'No se pudo cargar el perfil del usuario' }, { status: 502 });
  }

  const response = NextResponse.json({
    user: {
      id: session.user.id,
      name: profile.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
      email: session.user.email ?? input.data.email,
      role: profile.role,
    },
  });
  response.cookies.set('sb-access-token', session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: session.expires_in,
    path: '/',
  });
  response.cookies.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}
