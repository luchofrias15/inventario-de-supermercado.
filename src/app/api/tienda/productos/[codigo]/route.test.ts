import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  actualizarPrecioProducto,
  desactivarProducto,
  exigirTiendaOperativa,
  obtenerProducto,
} from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { DELETE, GET, PATCH } from './route';

vi.mock('@/lib/dataService', () => ({
  actualizarPrecioProducto: vi.fn(),
  desactivarProducto: vi.fn(),
  exigirTiendaOperativa: vi.fn(),
  obtenerProducto: vi.fn(),
}));
vi.mock('@/lib/auth/sesion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/sesion')>();
  return { ...actual, exigirSesion: vi.fn() };
});

const desactivarMock = vi.mocked(desactivarProducto);
const actualizarPrecioMock = vi.mocked(actualizarPrecioProducto);
const tiendaOperativaMock = vi.mocked(exigirTiendaOperativa);
const obtenerMock = vi.mocked(obtenerProducto);
const exigirSesionMock = vi.mocked(exigirSesion);

afterEach(() => {
  vi.resetAllMocks();
});

describe('/api/tienda/productos/[codigo]', () => {
  it('requiere sesión antes de desactivar un producto', async () => {
    exigirSesionMock.mockRejectedValueOnce(new ErrorDeNegocio('NO_AUTORIZADO'));

    const response = await DELETE(
      new Request('http://localhost/api/tienda/productos/LECHE', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ codigo: 'LECHE' }) },
    );

    expect(response.status).toBe(401);
    expect(desactivarMock).not.toHaveBeenCalled();
  });

  it('desactiva el producto y confirma que se ocultará de la lista activa', async () => {
    exigirSesionMock.mockResolvedValueOnce({
      id: 'user-id',
      email: 'tienda@example.com',
      role: 'store_admin',
      storeId: 'store-id',
    });
    tiendaOperativaMock.mockResolvedValueOnce('store-id');
    desactivarMock.mockResolvedValueOnce();

    const response = await DELETE(
      new Request('http://localhost/api/tienda/productos/LECHE', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ codigo: 'LECHE' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      datos: { codigo: 'LECHE', activo: false },
    });
    expect(desactivarMock).toHaveBeenCalledWith('LECHE', 'store-id');
  });

  it('mantiene GET protegido y devuelve el detalle del producto', async () => {
    exigirSesionMock.mockResolvedValueOnce({
      id: 'user-id',
      email: 'tienda@example.com',
      role: 'store_admin',
      storeId: 'store-id',
    });
    tiendaOperativaMock.mockResolvedValueOnce('store-id');
    obtenerMock.mockResolvedValueOnce({
      id: 'producto-id',
      codigo: 'LECHE',
      nombre: 'Leche',
      categoria: 'perecedero',
      precioUnitario: 2800,
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
    expect(obtenerMock).toHaveBeenCalledWith('LECHE', 'store-id');
  });

  it('actualiza el precio dentro de la tienda autorizada', async () => {
    exigirSesionMock.mockResolvedValueOnce({
      id: 'user-id',
      email: 'tienda@example.com',
      role: 'store_admin',
      storeId: 'store-id',
    });
    tiendaOperativaMock.mockResolvedValueOnce('store-id');
    actualizarPrecioMock.mockResolvedValueOnce({
      id: 'producto-id',
      codigo: 'LECHE',
      precioUnitario: 3200,
    });

    const response = await PATCH(
      new Request('http://localhost/api/tienda/productos/LECHE', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ precioUnitario: 3200 }),
      }),
      { params: Promise.resolve({ codigo: 'LECHE' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      datos: { id: 'producto-id', codigo: 'LECHE', precioUnitario: 3200 },
    });
    expect(actualizarPrecioMock).toHaveBeenCalledWith('LECHE', 3200, 'store-id');
  });

  it('rechaza precios no válidos sin actualizar el producto', async () => {
    exigirSesionMock.mockResolvedValueOnce({
      id: 'user-id',
      email: 'tienda@example.com',
      role: 'store_admin',
      storeId: 'store-id',
    });
    tiendaOperativaMock.mockResolvedValueOnce('store-id');

    const response = await PATCH(
      new Request('http://localhost/api/tienda/productos/LECHE', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ precioUnitario: 0 }),
      }),
      { params: Promise.resolve({ codigo: 'LECHE' }) },
    );

    expect(response.status).toBe(400);
    expect(actualizarPrecioMock).not.toHaveBeenCalled();
  });

  it('denies customers from deactivating products', async () => {
    exigirSesionMock.mockResolvedValueOnce({
      id: 'user-id',
      email: 'cliente@example.com',
      role: 'user',
      storeId: null,
    });
    tiendaOperativaMock.mockRejectedValueOnce(new ErrorDeNegocio('PERMISO_DENEGADO'));

    const response = await DELETE(
      new Request('http://localhost/api/tienda/productos/LECHE', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ codigo: 'LECHE' }) },
    );

    expect(response.status).toBe(403);
    expect(desactivarMock).not.toHaveBeenCalled();
  });

  it('denies customers from changing product prices', async () => {
    exigirSesionMock.mockResolvedValueOnce({
      id: 'user-id',
      email: 'cliente@example.com',
      role: 'user',
      storeId: null,
    });
    tiendaOperativaMock.mockRejectedValueOnce(new ErrorDeNegocio('PERMISO_DENEGADO'));

    const response = await PATCH(
      new Request('http://localhost/api/tienda/productos/LECHE', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ precioUnitario: 3200 }),
      }),
      { params: Promise.resolve({ codigo: 'LECHE' }) },
    );

    expect(response.status).toBe(403);
    expect(actualizarPrecioMock).not.toHaveBeenCalled();
  });
});
