import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseConfig } from '@/lib/supabase-config';

export const runtime = 'nodejs';

const registroSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(1024),
    accountType: z.enum(['customer', 'store_admin', 'page_admin']).default('customer'),
    storeName: z.string().trim().max(120).optional(),
  })
  .superRefine((data, context) => {
    if (data.accountType === 'store_admin' && !data.storeName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['storeName'],
        message: 'Ingresa el nombre de tu tienda.',
      });
    }
  });

interface SupabaseSignupResponse {
  id?: string;
  user?: { id?: string };
  access_token?: string;
  refresh_token?: string;
  session?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function codigoErrorSupabase(error: unknown): string | undefined {
  if (!esObjeto(error)) return undefined;
  const codigo = error.error_code ?? error.code ?? error.error;
  return typeof codigo === 'string' ? codigo : undefined;
}

function respuestaErrorRegistro(status: number, error: unknown): NextResponse {
  const codigo = codigoErrorSupabase(error);
  if (status === 429 || codigo?.includes('rate_limit')) {
    return NextResponse.json(
      {
        error:
          codigo === 'over_email_send_rate_limit'
            ? 'Supabase limitó el envío de correos de confirmación. Espera antes de volver a intentarlo y revisa tu bandeja de entrada.'
            : 'Supabase limitó temporalmente los registros. Espera un momento antes de volver a intentarlo.',
      },
      { status: 429 },
    );
  }
  if (codigo === 'weak_password') {
    return NextResponse.json(
      {
        error:
          'La contraseña no cumple los requisitos de seguridad. Prueba con una más larga y menos común.',
      },
      { status: 400 },
    );
  }
  if (codigo === 'email_address_invalid') {
    return NextResponse.json(
      { error: 'El correo no es válido. Revísalo e inténtalo de nuevo.' },
      { status: 400 },
    );
  }
  if (codigo === 'signup_disabled' || codigo === 'email_provider_disabled') {
    return NextResponse.json(
      {
        error:
          'El registro por correo está desactivado en Supabase. Contacta al administrador del sistema.',
      },
      { status: 503 },
    );
  }
  if (codigo && codigo !== 'user_already_exists' && codigo !== 'email_exists') {
    console.error('Supabase Auth rechazó el registro:', { status, code: codigo });
  }
  return NextResponse.json(
    {
      error:
        'No fue posible crear la cuenta. Verifica los datos o intenta iniciar sesión si ya tienes una cuenta.',
    },
    { status: status >= 500 ? 502 : 400 },
  );
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
        data: {
          full_name: input.data.nombre,
          account_type: input.data.accountType,
          ...(input.data.storeName ? { store_name: input.data.storeName } : {}),
        },
      }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con Supabase Auth.' }, { status: 502 });
  }

  if (!signupResponse.ok) {
    let error: unknown;
    try {
      error = await signupResponse.json();
    } catch (causa) {
      if (!(causa instanceof SyntaxError)) throw causa;
    }
    return respuestaErrorRegistro(signupResponse.status, error);
  }

  let result: unknown;
  try {
    result = await signupResponse.json();
  } catch {
    return NextResponse.json(
      { error: 'Supabase respondió con un formato inválido al crear la cuenta.' },
      { status: 502 },
    );
  }

  if (!esObjeto(result)) {
    return NextResponse.json(
      { error: 'Supabase respondió con un formato inválido al crear la cuenta.' },
      { status: 502 },
    );
  }

  const signup = result as SupabaseSignupResponse;
  const userId =
    (esObjeto(signup.user) && typeof signup.user.id === 'string' ? signup.user.id : undefined) ??
    (typeof signup.id === 'string' ? signup.id : undefined);
  if (!userId) {
    return NextResponse.json(
      {
        error: 'Supabase no devolvió el usuario creado. Verifica si el correo ya está registrado.',
      },
      { status: 502 },
    );
  }

  const session = esObjeto(signup.session) ? signup.session : undefined;
  const accessToken =
    (typeof signup.access_token === 'string' ? signup.access_token : undefined) ??
    (typeof session?.access_token === 'string' ? session.access_token : undefined);
  const refreshToken =
    (typeof signup.refresh_token === 'string' ? signup.refresh_token : undefined) ??
    (typeof session?.refresh_token === 'string' ? session.refresh_token : undefined);
  return NextResponse.json(
    {
      confirmationRequired: !accessToken || !refreshToken,
      ...(input.data.accountType === 'page_admin' ? { requestPending: true } : {}),
    },
    { status: 201 },
  );
}
