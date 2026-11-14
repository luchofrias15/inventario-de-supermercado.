import { describe, expect, it } from 'vitest';
import { validarEntrada } from '@/lib/reglas/lote';
import { esperarCodigo } from './ayudas';

describe('reglas de entrada de lotes', () => {
  it('T-19: exige vencimiento a los productos perecederos', async () => {
    await esperarCodigo(
      () =>
        validarEntrada({
          cantidad: 2,
          categoria: 'perecedero',
          fechaEntrada: '2026-06-15',
        }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-20: rechaza vencimiento anterior a la entrada', async () => {
    await esperarCodigo(
      () =>
        validarEntrada({
          cantidad: 2,
          categoria: 'perecedero',
          fechaEntrada: '2026-06-15',
          fechaVencimiento: '2026-06-14',
        }),
      'FECHA_INVALIDA',
    );
  });

  it('T-21: permite entrada no perecedera sin vencimiento', () => {
    expect(() =>
      validarEntrada({
        cantidad: 2,
        categoria: 'no_perecedero',
        fechaEntrada: '2026-06-15',
      }),
    ).not.toThrow();
  });

  it('T-22: permite vencimiento igual o posterior a la entrada', () => {
    expect(() =>
      validarEntrada({
        cantidad: 2,
        categoria: 'perecedero',
        fechaEntrada: '2026-06-15',
        fechaVencimiento: '2026-06-15',
      }),
    ).not.toThrow();
  });
});
