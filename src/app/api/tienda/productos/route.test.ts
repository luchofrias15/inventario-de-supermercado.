import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { crearProducto, exigirTiendaOperativa, listarInventario } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { GET, POST } from './route';

vi.mock('@/lib/dataService', () => ({
  crearProducto: vi.fn(),
  exigirTiendaOperativa: vi.fn(),
  listarInventario: vi.fn(),
}));
vi.mock('@/lib/auth/sesion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/sesion')>();
  return { ...actual, exigirSesion: vi.fn() };
});

const crearProductoMock = vi.mocked(crearProducto);
const tiendaOperativaMock = vi.mocked(exigirTiendaOperativa);
const listarInventarioMock = vi.mocked(listarInventario);
const exigirSesionMock = vi.mocked(exigirSesion);

afterEach(() => {
  vi.resetAllMocks();
});

const cliente = {
  id: 'customer-id',
  email: 'cliente@example.com',
  role: 'user' as const,
  storeId: null,
};

const administradorTienda = {
  id: 'store-admin-id',
  email: 'admin@example.com',
  role: 'store_admin' as const,
  storeId: 'store-id',
};
const administradorPagina = {
  id: 'admin-id',
  email: 'admin@example.com',
  role: 'admin' as const,
  storeId: 'default-store-id',
};

describe('/api/tienda/productos', () => {
  it('scopes store administrators to their own inventory', async () => {
    exigirSesionMock.mockResolvedValueOnce(administradorTienda);
    tiendaOperativaMock.mockResolvedValueOnce('store-id');
    listarInventarioMock.mockResolvedValueOnce([]);

    const response = await GET(new Request('http://localhost/api/tienda/productos'));

    expect(response.status).toBe(200);
    expect(listarInventarioMock).toHaveBeenCalledWith(
      { busqueda: undefined, soloReorden: undefined },
      'store-id',
    );
  });

  it('lets page administrators choose the inventory store', async () => {
    exigirSesionMock.mockResolvedValueOnce(administradorPagina);
    tiendaOperativaMock.mockResolvedValueOnce('other-store');
    listarInventarioMock.mockResolvedValueOnce([]);

    const response = await GET(
      new Request('http://localhost/api/tienda/productos?storeId=other-store'),
    );

    expect(response.status).toBe(200);
    expect(tiendaOperativaMock).toHaveBeenCalledWith(administradorPagina, 'other-store');
    expect(listarInventarioMock).toHaveBeenCalledWith(
      { busqueda: undefined, soloReorden: undefined },
      'other-store',
    );
  });

  it('does not allow customers to create products', async () => {
    exigirSesionMock.mockResolvedValueOnce(cliente);
    tiendaOperativaMock.mockRejectedValueOnce(new ErrorDeNegocio('PERMISO_DENEGADO'));

    const response = await POST(new Request('http://localhost/api/tienda/productos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        codigo: 'ARROZ-1',
        nombre: 'Arroz',
        categoria: 'no_perecedero',
        precioUnitario: 2500,
      }),
    }));

    expect(response.status).toBe(403);
    expect(crearProductoMock).not.toHaveBeenCalled();
  });

  it('creates products inside the store administrator’s own store', async () => {
    exigirSesionMock.mockResolvedValueOnce(administradorTienda);
    tiendaOperativaMock.mockResolvedValueOnce('store-id');
    crearProductoMock.mockResolvedValueOnce({ id: 'product-id', codigo: 'ARROZ-1' });

    const response = await POST(new Request('http://localhost/api/tienda/productos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        codigo: 'ARROZ-1',
        nombre: 'Arroz',
        categoria: 'no_perecedero',
        precioUnitario: 2500,
      }),
    }));

    expect(response.status).toBe(201);
    expect(crearProductoMock).toHaveBeenCalledWith({
      codigo: 'ARROZ-1',
      nombre: 'Arroz',
      categoria: 'no_perecedero',
      precioUnitario: 2500,
    }, 'store-id');
  });
});
