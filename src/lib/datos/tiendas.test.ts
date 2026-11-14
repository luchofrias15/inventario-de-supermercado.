import { afterEach, describe, expect, it, vi } from 'vitest';
import { consultar } from '@/lib/db/conexion';
import { exigirTiendaOperativa, listarTiendas } from './tiendas';

vi.mock('@/lib/db/conexion', () => ({ consultar: vi.fn() }));
vi.mock('./productos', () => ({ listarInventario: vi.fn() }));

const consultarMock = vi.mocked(consultar);

afterEach(() => {
  vi.resetAllMocks();
});

const administradorTienda = {
  id: 'store-admin-id',
  email: 'admin@example.com',
  role: 'store_admin' as const,
  storeId: 'owned-store',
};

describe('alcance de tiendas', () => {
  it('limita al administrador de tienda a su propio inventario', async () => {
    await expect(
      exigirTiendaOperativa(administradorTienda, 'other-store'),
    ).rejects.toMatchObject({ codigo: 'PERMISO_DENEGADO' });
    expect(consultarMock).not.toHaveBeenCalled();
  });

  it('permite al administrador global operar en una tienda elegida', async () => {
    consultarMock.mockResolvedValueOnce([{ id: 'other-store', name: 'Otra tienda', product_count: 2 }]);

    await expect(
      exigirTiendaOperativa(
        { ...administradorTienda, role: 'admin', storeId: 'owned-store' },
        'other-store',
      ),
    ).resolves.toBe('other-store');
  });

  it('lista todas las tiendas para que el administrador de tienda pueda explorar catálogos', async () => {
    consultarMock.mockResolvedValueOnce([
      { id: 'owned-store', name: 'Mi tienda', product_count: 2 },
      { id: 'other-store', name: 'Otra tienda', product_count: 3 },
    ]);

    await expect(listarTiendas()).resolves.toEqual([
      { id: 'owned-store', nombre: 'Mi tienda', productosActivos: 2 },
      { id: 'other-store', nombre: 'Otra tienda', productosActivos: 3 },
    ]);
    expect(consultarMock.mock.calls[0]?.[0]).not.toContain('WHERE stores.id');
  });
});
