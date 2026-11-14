import { describe, expect, it } from 'vitest';
import { descontarPorFefo } from '@/lib/reglas/inventario';

const LOTES = [
  { id: 1, cantidad: 3, fechaVencimiento: '2026-06-18' },
  { id: 2, cantidad: 5, fechaVencimiento: '2026-06-25' },
];

describe('descuento FEFO', () => {
  it('T-23: continúa en el siguiente lote cuando el primero no alcanza', () => {
    expect(descontarPorFefo(LOTES, 4)).toEqual([
      { loteId: 1, descuento: 3 },
      { loteId: 2, descuento: 1 },
    ]);
  });

  it('T-24: agota el primer lote antes de tocar el siguiente', () => {
    expect(descontarPorFefo(LOTES, 3)).toEqual([{ loteId: 1, descuento: 3 }]);
  });
});
