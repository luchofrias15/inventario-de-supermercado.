import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const fetchMock = vi.fn<typeof fetch>();
const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllEnvs();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', originalFetch);
});

function registroRequest(body: unknown) {
  return new Request('http://localhost/api/auth/registro', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      captchaToken: 'test-captcha-token',
      ...(typeof body === 'object' && body !== null ? body : {}),
    }),
  });
}

describe('registro endpoint', () => {
  it('accepts Supabase Auth REST user responses and reports email confirmation when required', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(
      Response.json({
        id: 'user-id',
        email: 'ana@example.com',
        confirmation_sent_at: '2026-11-14T00:00:00Z',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: '  Ana Pérez  ',
        email: ' ANA@example.com ',
        password: 'secure-password',
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ confirmationRequired: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.supabase.co/auth/v1/signup');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      email: 'ana@example.com',
      password: 'secure-password',
      data: { full_name: 'Ana Pérez', account_type: 'customer' },
      gotrue_meta_security: { captcha_token: 'test-captcha-token' },
    });
  });

  it('accepts a user wrapped in a session response when email is auto-confirmed', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(
      Response.json({
        user: { id: 'user-id' },
        session: { access_token: 'access-token', refresh_token: 'refresh-token' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        password: 'secure-password',
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ confirmationRequired: false });
  });

  it('rejects invalid registration data without contacting Supabase', async () => {
    const response = await POST(
      registroRequest({
        nombre: '',
        email: 'no-es-correo',
        password: 'short',
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires a CAPTCHA token before contacting Supabase Auth', async () => {
    const response = await POST(
      registroRequest({
        nombre: 'Ana',
        email: 'ana@example.com',
        password: 'secure-password',
        captchaToken: '',
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains when Supabase rejects the CAPTCHA verification', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(Response.json({ code: 'captcha_failed' }, { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: 'Ana',
        email: 'ana@example.com',
        password: 'secure-password',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        'Supabase no pudo validar el CAPTCHA. Completa de nuevo la verificación e inténtalo otra vez.',
    });
  });

  it('creates a store-admin signup with the store name in user metadata', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'user-id' }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: 'Luis',
        email: 'luis@example.com',
        password: 'secure-password',
        accountType: 'store_admin',
        storeName: 'Tienda Luis',
      }),
    );

    expect(response.status).toBe(201);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      data: {
        full_name: 'Luis',
        account_type: 'store_admin',
        store_name: 'Tienda Luis',
      },
    });
  });

  it('does not contact Supabase when a store-admin signup omits the store name', async () => {
    const response = await POST(
      registroRequest({
        nombre: 'Luis',
        email: 'luis@example.com',
        password: 'secure-password',
        accountType: 'store_admin',
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks a page-admin signup as pending without granting a role in the response', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'user-id' }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: 'Ana',
        email: 'ana@example.com',
        password: 'secure-password',
        accountType: 'page_admin',
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      confirmationRequired: true,
      requestPending: true,
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).data).toEqual({
      full_name: 'Ana',
      account_type: 'page_admin',
    });
  });

  it('rejects invalid JSON requests', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/registro', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
    );

    expect(response.status).toBe(400);
  });

  it('explains when Supabase limits confirmation emails', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: 'over_email_send_rate_limit' }, { status: 429 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        password: 'secure-password',
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error:
        'Supabase limitó el envío de correos de confirmación. Espera antes de volver a intentarlo y revisa tu bandeja de entrada.',
    });
  });

  it('explains when the password does not meet Supabase requirements', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(Response.json({ code: 'weak_password' }, { status: 422 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        password: 'secure-password',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        'La contraseña no cumple los requisitos de seguridad. Prueba con una más larga y menos común.',
    });
  });

  it('returns a safe error when Supabase rejects account creation for an unknown reason', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 422 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      registroRequest({
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        password: 'secure-password',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        'No fue posible crear la cuenta. Verifica los datos o intenta iniciar sesión si ya tienes una cuenta.',
    });
  });
});
