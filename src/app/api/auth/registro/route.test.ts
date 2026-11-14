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
    body: JSON.stringify(body),
  });
}

describe('registro endpoint', () => {
  it('creates an account through Supabase and reports email confirmation when required', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(Response.json({ user: { id: 'user-id' } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(registroRequest({
      nombre: '  Ana Pérez  ',
      email: ' ANA@example.com ',
      password: 'secure-password',
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ confirmationRequired: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.supabase.co/auth/v1/signup');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      email: 'ana@example.com',
      password: 'secure-password',
      data: { full_name: 'Ana Pérez' },
    });
  });

  it('rejects invalid registration data without contacting Supabase', async () => {
    const response = await POST(registroRequest({
      nombre: '',
      email: 'no-es-correo',
      password: 'short',
    }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON requests', async () => {
    const response = await POST(new Request('http://localhost/api/auth/registro', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    }));

    expect(response.status).toBe(400);
  });

  it('returns a safe error when Supabase rejects account creation', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 422 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(registroRequest({
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'secure-password',
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'No fue posible crear la cuenta. Verifica los datos o intenta iniciar sesión.',
    });
  });
});
