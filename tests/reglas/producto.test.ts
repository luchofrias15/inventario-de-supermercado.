import { describe, expect, it } from 'vitest';
import { validarProducto } from '@/lib/reglas/producto';
import { esperarCodigo } from './ayudas';

describe('reglas de productos', () => {
  it('T-25: rechaza una categoría que no está permitida', async () => {
    await esperarCodigo(
      () => validarProducto({ codigo: 'A-1', nombre: 'Producto', categoria: 'otra' }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-26: acepta los datos requeridos de un producto', () => {
    expect(() =>
      validarProducto({ codigo: 'A-1', nombre: 'Producto', categoria: 'perecedero' }),
    ).not.toThrow();
  });
});
