import { afterEach, describe, expect, it, vi } from 'vitest';
import { desactivarProducto, obtenerProducto } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { DELETE, GET } from './route';

vi.mock('@/lib/dataService', () => ({
  desactivarProducto: vi.fn(),
  obtenerProducto: vi.fn(),
}));
vi.mock('@/lib/auth/sesion', () => ({ exigirSesion: vi.fn() }));

const desactivarMock = vi.mocked(desactivarProducto);
const obtenerMock = vi.mocked(obtenerProducto);
const exigirSesionMock = vi.mocked(exigirSesion);

afterEach(() => {
  vi.resetAllMocks();
});

describe('/api/tienda/productos/[codigo]', () => {
  it('requiere sesión antes de desactivar un producto', async () => {
    exigirSesionMock.mockRejectedValueOnce(new ErrorDeNegocio('NO_AUTORIZADO'));

    const response = await DELETE(new Request('http://localhost/api/tienda/productos/LECHE', {
      method: 'DELETE',
    }), { params: Promise.resolve({ codigo: 'LECHE' }) });

    expect(response.status).toBe(401);
    expect(desactivarMock).not.toHaveBeenCalled();
  });

  it('desactiva el producto y confirma que se ocultará de la lista activa', async () => {
    exigirSesionMock.mockResolvedValueOnce({ email: 'tienda@example.com' });
    desactivarMock.mockResolvedValueOnce();

    const response = await DELETE(new Request('http://localhost/api/tienda/productos/LECHE', {
      method: 'DELETE',
    }), { params: Promise.resolve({ codigo: 'LECHE' }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      datos: { codigo: 'LECHE', activo: false },
    });
    expect(desactivarMock).toHaveBeenCalledWith('LECHE');
  });

  it('mantiene GET protegido y devuelve el detalle del producto', async () => {
    exigirSesionMock.mockResolvedValueOnce({ email: 'tienda@example.com' });
    obtenerMock.mockResolvedValueOnce({
      id: 'producto-id',
      codigo: 'LECHE',
      nombre: 'Leche',
      categoria: 'perecedero',
      proveedor: null,
      puntoReorden: 10,
      stockDisponible: 0,
      paraReordenar: true,
      activo: true,
      lotes: [],
      movimientos: [],
    });

    const response = await GET(new Request('http://localhost/api/tienda/productos/LECHE'), {
      params: Promise.resolve({ codigo: 'LECHE' }),
    });

    expect(response.status).toBe(200);
    expect(obtenerMock).toHaveBeenCalledWith('LECHE');
  });
});
