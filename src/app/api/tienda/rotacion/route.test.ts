import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { reporteRotacion } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { GET } from './route';

vi.mock('@/lib/dataService', () => ({ reporteRotacion: vi.fn() }));
vi.mock('@/lib/auth/sesion', () => ({ exigirSesion: vi.fn() }));

const reporteMock = vi.mocked(reporteRotacion);
const exigirSesionMock = vi.mocked(exigirSesion);

afterEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/tienda/rotacion', () => {
  it('requiere sesión antes de consultar el reporte', async () => {
    exigirSesionMock.mockRejectedValueOnce(new ErrorDeNegocio('NO_AUTORIZADO'));

    const response = await GET(new Request('http://localhost/api/tienda/rotacion?desde=2026-11-01&hasta=2026-11-14'));

    expect(response.status).toBe(401);
    expect(reporteMock).not.toHaveBeenCalled();
  });

  it('valida el rango antes de consultar la rotación', async () => {
    exigirSesionMock.mockResolvedValueOnce({ email: 'tienda@example.com' });

    const response = await GET(new Request('http://localhost/api/tienda/rotacion?desde=2026-11-15&hasta=2026-11-14'));

    expect(response.status).toBe(400);
    expect(reporteMock).not.toHaveBeenCalled();
  });

  it('devuelve productos para un rango válido', async () => {
    exigirSesionMock.mockResolvedValueOnce({ email: 'tienda@example.com' });
    reporteMock.mockResolvedValueOnce([
      { codigo: 'ARROZ', nombre: 'Arroz', unidadesVendidas: 12 },
    ]);

    const response = await GET(new Request('http://localhost/api/tienda/rotacion?desde=2026-11-01&hasta=2026-11-14'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      datos: [{ codigo: 'ARROZ', nombre: 'Arroz', unidadesVendidas: 12 }],
    });
    expect(reporteMock).toHaveBeenCalledWith('2026-11-01', '2026-11-14');
  });
});
