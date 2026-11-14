import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { exigirTiendaOperativa, lotesPorVencer } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { GET } from './route';

vi.mock('@/lib/dataService', () => ({
  exigirTiendaOperativa: vi.fn(),
  lotesPorVencer: vi.fn(),
}));
vi.mock('@/lib/auth/sesion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/sesion')>();
  return { ...actual, exigirSesion: vi.fn() };
});

const lotesMock = vi.mocked(lotesPorVencer);
const tiendaOperativaMock = vi.mocked(exigirTiendaOperativa);
const exigirSesionMock = vi.mocked(exigirSesion);

afterEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/tienda/vencimientos', () => {
  it('requiere sesión antes de consultar lotes', async () => {
    exigirSesionMock.mockRejectedValueOnce(new ErrorDeNegocio('NO_AUTORIZADO'));

    const response = await GET(new Request('http://localhost/api/tienda/vencimientos?storeId=store-id'));

    expect(response.status).toBe(401);
    expect(lotesMock).not.toHaveBeenCalled();
  });

  it('devuelve lotes clasificados cuando hay sesión', async () => {
    exigirSesionMock.mockResolvedValueOnce({
      id: 'user-id',
      email: 'tienda@example.com',
      role: 'store_admin',
      storeId: 'store-id',
    });
    tiendaOperativaMock.mockResolvedValueOnce('store-id');
    lotesMock.mockResolvedValueOnce([
      {
        id: 9,
        cantidad: 3,
        fechaEntrada: '2026-11-01',
        fechaVencimiento: '2026-11-16',
        estadoVencimiento: 'por_vencer',
        codigo: 'LECHE',
        nombre: 'Leche',
      },
    ]);

    const response = await GET(new Request('http://localhost/api/tienda/vencimientos?storeId=store-id'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      datos: [{ estadoVencimiento: 'por_vencer', codigo: 'LECHE' }],
    });
    expect(lotesMock).toHaveBeenCalledWith('store-id');
  });
});
