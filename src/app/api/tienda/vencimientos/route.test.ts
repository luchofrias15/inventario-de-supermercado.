import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { lotesPorVencer } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { GET } from './route';

vi.mock('@/lib/dataService', () => ({ lotesPorVencer: vi.fn() }));
vi.mock('@/lib/auth/sesion', () => ({ exigirSesion: vi.fn() }));

const lotesMock = vi.mocked(lotesPorVencer);
const exigirSesionMock = vi.mocked(exigirSesion);

afterEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/tienda/vencimientos', () => {
  it('requiere sesión antes de consultar lotes', async () => {
    exigirSesionMock.mockRejectedValueOnce(new ErrorDeNegocio('NO_AUTORIZADO'));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(lotesMock).not.toHaveBeenCalled();
  });

  it('devuelve lotes clasificados cuando hay sesión', async () => {
    exigirSesionMock.mockResolvedValueOnce({ email: 'tienda@example.com' });
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

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      datos: [{ estadoVencimiento: 'por_vencer', codigo: 'LECHE' }],
    });
  });
});
