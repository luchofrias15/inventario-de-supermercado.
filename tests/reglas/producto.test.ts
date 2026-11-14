import { describe, expect, it } from 'vitest';
import { validarProducto } from '@/lib/reglas/producto';
import { esperarCodigo } from './ayudas';

describe('reglas de productos', () => {
  it('T-25: rechaza una categoría que no está permitida', async () => {
    await esperarCodigo(
      () => validarProducto({
        codigo: 'A-1',
        nombre: 'Producto',
        categoria: 'otra',
        precioUnitario: 100,
      }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-26: acepta los datos requeridos de un producto', () => {
    expect(() =>
      validarProducto({
        codigo: 'A-1',
        nombre: 'Producto',
        categoria: 'perecedero',
        precioUnitario: 100,
      }),
    ).not.toThrow();
  });

  it('rechaza un precio por unidad que no sea positivo', async () => {
    await esperarCodigo(
      () => validarProducto({
        codigo: 'A-1',
        nombre: 'Producto',
        categoria: 'perecedero',
        precioUnitario: 0,
      }),
      'DATOS_INVALIDOS',
    );
  });
});
