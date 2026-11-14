import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const fetchMock = vi.fn<typeof fetch>();
const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllEnvs();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', originalFetch);
});

function loginRequest(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('login endpoint', () => {
  it('authenticates with Supabase Auth, returns the profile role and sets HttpOnly session cookies', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock
      .mockResolvedValueOnce(Response.json({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        user: {
          id: 'user-id',
          email: 'admin@example.com',
          user_metadata: { full_name: 'Administrador' },
        },
      }))
      .mockResolvedValueOnce(Response.json([{ full_name: 'Administrador', role: 'admin' }]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(loginRequest({
      email: ' ADMIN@example.com ',
      password: 'secure-password',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual({
      id: 'user-id',
      name: 'Administrador',
      email: 'admin@example.com',
      role: 'admin',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.supabase.co/auth/v1/token?grant_type=password');
    expect(response.headers.getSetCookie().join(';')).toContain('sb-access-token=access-token');
    expect(response.headers.getSetCookie().join(';')).toContain('sb-refresh-token=refresh-token');
    expect(response.headers.getSetCookie().join(';')).toContain('HttpOnly');
  });

  it('rejects credentials rejected by Supabase', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(loginRequest({
      email: 'admin@example.com',
      password: 'wrong-password',
    }));

    expect(response.status).toBe(401);
  });

  it('rejects malformed login data', async () => {
    const response = await POST(loginRequest({ email: 'no-es-correo', password: '' }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON requests', async () => {
    const response = await POST(new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    }));

    expect(response.status).toBe(400);
  });

  it('rejects login when the Supabase profile does not exist', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    fetchMock
      .mockResolvedValueOnce(Response.json({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        user: { id: 'user-id', email: 'user@example.com' },
      }))
      .mockResolvedValueOnce(Response.json([]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(loginRequest({
      email: 'user@example.com',
      password: 'secure-password',
    }));

    expect(response.status).toBe(403);
  });
});
