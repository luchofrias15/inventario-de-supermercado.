import { describe, expect, it } from 'vitest';
import { hayStockSuficiente, validarCantidad } from '@/lib/reglas/inventario';
import { esperarCodigo } from './ayudas';

describe('reglas de inventario', () => {
  it('T-12: rechaza cantidad cero', async () => {
    await esperarCodigo(() => validarCantidad(0), 'DATOS_INVALIDOS');
  });

  it('T-13: rechaza cantidad negativa', async () => {
    await esperarCodigo(() => validarCantidad(-1), 'DATOS_INVALIDOS');
  });

  it('T-14: rechaza cantidad fraccionaria', async () => {
    await esperarCodigo(() => validarCantidad(2.5), 'DATOS_INVALIDOS');
  });

  it('T-15: acepta una cantidad entera positiva', () => {
    expect(() => validarCantidad(3)).not.toThrow();
  });

  it('T-16: permite vender exactamente el stock disponible', () => {
    expect(hayStockSuficiente(5, 5)).toBe(true);
  });

  it('T-17: rechaza vender más del stock disponible', () => {
    expect(hayStockSuficiente(5, 6)).toBe(false);
  });

  it('T-18: no permite vender si no hay stock', () => {
    expect(hayStockSuficiente(0, 1)).toBe(false);
  });
});
