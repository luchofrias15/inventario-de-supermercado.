import { afterEach, describe, expect, it, vi } from 'vitest';
import { exigirSesion, obtenerTokenSesion } from '@/lib/auth/sesion';
import { GET, POST } from './route';

const fetchMock = vi.fn<typeof fetch>();
const originalFetch = globalThis.fetch;

vi.mock('@/lib/auth/sesion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/sesion')>();
  return {
    ...actual,
    exigirSesion: vi.fn(),
    obtenerTokenSesion: vi.fn(),
  };
});

const exigirSesionMock = vi.mocked(exigirSesion);
const tokenMock = vi.mocked(obtenerTokenSesion);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.stubGlobal('fetch', originalFetch);
  fetchMock.mockReset();
  vi.resetAllMocks();
});

function sesion(role: 'admin' | 'store_admin' | 'user') {
  return {
    id: 'auth-user-id',
    email: 'admin@example.com',
    role,
    storeId: 'store-id',
  };
}

describe('/api/admin/solicitudes', () => {
  it('only lets page administrators list pending requests', async () => {
    exigirSesionMock.mockResolvedValueOnce(sesion('store_admin'));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists requests through the authenticated Supabase RPC', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    exigirSesionMock.mockResolvedValueOnce(sesion('admin'));
    tokenMock.mockResolvedValueOnce('access-token');
    fetchMock.mockResolvedValueOnce(Response.json([
      { id: 'request-id', email: 'user@example.com', full_name: 'User', requested_at: '2026-11-14T00:00:00Z' },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      datos: [{ email: 'user@example.com' }],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://example.supabase.co/rest/v1/rpc/list_pending_page_admin_requests',
    );
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      apikey: 'test-api-key',
      authorization: 'Bearer access-token',
    });
  });

  it('submits an approval decision through the authenticated Supabase RPC', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-api-key');
    exigirSesionMock.mockResolvedValueOnce(sesion('admin'));
    tokenMock.mockResolvedValueOnce('access-token');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(new Request('http://localhost/api/admin/solicitudes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: '00000000-0000-4000-8000-000000000001', decision: 'approved' }),
    }));

    expect(response.status).toBe(200);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      request_id: '00000000-0000-4000-8000-000000000001',
      decision: 'approved',
    });
  });
});
