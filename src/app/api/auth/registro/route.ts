import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseConfig } from '@/lib/supabase-config';

export const runtime = 'nodejs';

const registroSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(1024),
});

interface SupabaseSignupResponse {
  user?: { id?: string };
  access_token?: string;
  refresh_token?: string;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
    }
    throw error;
  }

  const input = registroSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      { error: 'Ingresa un nombre, correo válido y una contraseña de al menos 8 caracteres.' },
      { status: 400 },
    );
  }

  let config;
  try {
    config = getSupabaseConfig();
  } catch {
    return NextResponse.json(
      { error: 'La autenticación de Supabase no está configurada.' },
      { status: 503 },
    );
  }

  let signupResponse: Response;
  try {
    signupResponse = await fetch(`${config.url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: config.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: input.data.email,
        password: input.data.password,
        data: { full_name: input.data.nombre },
      }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con Supabase Auth.' },
      { status: 502 },
    );
  }

  if (!signupResponse.ok) {
    if (signupResponse.status === 429) {
      return NextResponse.json(
        { error: 'Demasiados intentos; inténtalo de nuevo más tarde.' },
        { status: 429 },
      );
    }
    if (signupResponse.status >= 400 && signupResponse.status < 500) {
      return NextResponse.json(
        { error: 'No fue posible crear la cuenta. Verifica los datos o intenta iniciar sesión.' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Supabase Auth no pudo crear la cuenta.' },
      { status: 502 },
    );
  }

  const result = (await signupResponse.json()) as SupabaseSignupResponse;
  if (!result.user?.id) {
    return NextResponse.json(
      { error: 'Supabase no confirmó la creación de la cuenta.' },
      { status: 502 },
    );
  }

  return NextResponse.json({
    confirmationRequired: !result.access_token || !result.refresh_token,
  }, { status: 201 });
}
