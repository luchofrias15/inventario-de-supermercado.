import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cancelarPedidoCliente,
  crearPedido,
  editarPedidoCliente,
  exigirTiendaOperativa,
  listarPedidosCliente,
  listarPedidosTienda,
  revisarPedido,
} from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { DELETE, GET, PATCH, POST, PUT } from './route';

vi.mock('@/lib/dataService', () => ({
  cancelarPedidoCliente: vi.fn(),
  crearPedido: vi.fn(),
  editarPedidoCliente: vi.fn(),
  exigirTiendaOperativa: vi.fn(),
  listarPedidosCliente: vi.fn(),
  listarPedidosTienda: vi.fn(),
  revisarPedido: vi.fn(),
}));
vi.mock('@/lib/auth/sesion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/sesion')>();
  return { ...actual, exigirSesion: vi.fn() };
});

const crearPedidoMock = vi.mocked(crearPedido);
const cancelarPedidoMock = vi.mocked(cancelarPedidoCliente);
const editarPedidoMock = vi.mocked(editarPedidoCliente);
const tiendaMock = vi.mocked(exigirTiendaOperativa);
const pedidosClienteMock = vi.mocked(listarPedidosCliente);
const pedidosTiendaMock = vi.mocked(listarPedidosTienda);
const revisarMock = vi.mocked(revisarPedido);
const sesionMock = vi.mocked(exigirSesion);

afterEach(() => vi.resetAllMocks());

const cliente = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'cliente@example.com',
  role: 'user' as const,
  storeId: null,
};
const adminTienda = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'tienda@example.com',
  role: 'store_admin' as const,
  storeId: '00000000-0000-4000-8000-000000000003',
};

describe('/api/tienda/pedidos', () => {
  it('creates a delivery order for a customer using submitted item ids', async () => {
    sesionMock.mockResolvedValueOnce(cliente);
    crearPedidoMock.mockResolvedValueOnce({
      id: '00000000-0000-4000-8000-000000000004',
      subtotal: 5000,
    });

    const response = await POST(new Request(
      'http://localhost/api/tienda/pedidos?storeId=00000000-0000-4000-8000-000000000003',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: '00000000-0000-4000-8000-000000000005', cantidad: 2 }],
          nombre: 'Cliente',
          telefono: '3001234567',
          direccion: 'Calle 1 # 2-3',
          barrio: 'Centro',
          instrucciones: '',
          metodoPago: 'efectivo',
        }),
      },
    ));

    expect(response.status).toBe(201);
    expect(crearPedidoMock).toHaveBeenCalledWith(
      cliente.id,
      cliente.email,
      '00000000-0000-4000-8000-000000000003',
      expect.objectContaining({ metodoPago: 'efectivo' }),
    );
  });

  it('shows customers only their own order list', async () => {
    sesionMock.mockResolvedValueOnce(cliente);
    pedidosClienteMock.mockResolvedValueOnce([]);

    const response = await GET(new Request('http://localhost/api/tienda/pedidos'));

    expect(response.status).toBe(200);
    expect(pedidosClienteMock).toHaveBeenCalledWith(cliente.id);
    expect(pedidosTiendaMock).not.toHaveBeenCalled();
  });

  it('lets a customer cancel their pending order', async () => {
    sesionMock.mockResolvedValueOnce(cliente);
    cancelarPedidoMock.mockResolvedValueOnce();

    const response = await DELETE(new Request('http://localhost/api/tienda/pedidos', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pedidoId: '00000000-0000-4000-8000-000000000006' }),
    }));

    expect(response.status).toBe(200);
    expect(cancelarPedidoMock).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000006',
      cliente.id,
    );
  });

  it('lets a customer edit the whole order', async () => {
    sesionMock.mockResolvedValueOnce(cliente);
    editarPedidoMock.mockResolvedValueOnce({
      id: '00000000-0000-4000-8000-000000000006',
      subtotal: 5000,
    });

    const response = await PUT(new Request('http://localhost/api/tienda/pedidos', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pedidoId: '00000000-0000-4000-8000-000000000006',
        items: [{ productId: '00000000-0000-4000-8000-000000000005', cantidad: 2 }],
        nombre: 'Cliente',
        telefono: '3001234567',
        direccion: 'Calle 1 # 2-3',
        barrio: 'Centro',
        instrucciones: '',
        metodoPago: 'transferencia',
      }),
    }));

    expect(response.status).toBe(200);
    expect(editarPedidoMock).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000006',
      cliente.id,
      expect.objectContaining({ metodoPago: 'transferencia', items: expect.any(Array) }),
    );
  });

  it('scopes store order review to the store administrator store', async () => {
    sesionMock.mockResolvedValueOnce(adminTienda);
    tiendaMock.mockResolvedValueOnce(adminTienda.storeId);
    revisarMock.mockResolvedValueOnce();

    const response = await PATCH(new Request(
      `http://localhost/api/tienda/pedidos?storeId=${adminTienda.storeId}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: '00000000-0000-4000-8000-000000000006',
          decision: 'accepted',
        }),
      },
    ));

    expect(response.status).toBe(200);
    expect(revisarMock).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000006',
      adminTienda.storeId,
      adminTienda.id,
      'accepted',
    );
  });

  it('does not allow store administrators to submit customer orders', async () => {
    sesionMock.mockResolvedValueOnce(adminTienda);

    const response = await POST(new Request(
      `http://localhost/api/tienda/pedidos?storeId=${adminTienda.storeId}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
    ));

    expect(response.status).toBe(403);
    expect(crearPedidoMock).not.toHaveBeenCalled();
  });

  it('rejects duplicate products in one order', async () => {
    sesionMock.mockResolvedValueOnce(cliente);
    const productId = '00000000-0000-4000-8000-000000000005';
    const response = await POST(new Request(
      'http://localhost/api/tienda/pedidos?storeId=00000000-0000-4000-8000-000000000003',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId, cantidad: 1 },
            { productId, cantidad: 2 },
          ],
          nombre: 'Cliente',
          telefono: '3001234567',
          direccion: 'Calle 1 # 2-3',
          barrio: 'Centro',
          metodoPago: 'efectivo',
        }),
      },
    ));

    expect(response.status).toBe(400);
    expect(crearPedidoMock).not.toHaveBeenCalled();
  });

  it('returns forbidden when a customer tries to review an order', async () => {
    sesionMock.mockResolvedValueOnce(cliente);
    tiendaMock.mockRejectedValueOnce(new ErrorDeNegocio('PERMISO_DENEGADO'));

    const response = await PATCH(new Request('http://localhost/api/tienda/pedidos', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: '00000000-0000-4000-8000-000000000006',
        decision: 'accepted',
      }),
    }));

    expect(response.status).toBe(403);
    expect(revisarMock).not.toHaveBeenCalled();
  });
});
