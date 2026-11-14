import { describe, expect, it } from 'vitest';
import { estaVencido, estadoVencimiento } from '@/lib/reglas/vencimiento';

const HOY = '2026-06-15';

describe('reglas de vencimiento', () => {
  it('T-05: seis días antes del vencimiento está vigente', () => {
    expect(estadoVencimiento('2026-06-21', HOY, 5)).toBe('vigente');
  });

  it('T-06: cinco días antes del vencimiento está por vencer', () => {
    expect(estadoVencimiento('2026-06-20', HOY, 5)).toBe('por_vencer');
  });

  it('T-07: un día antes del vencimiento está por vencer', () => {
    expect(estadoVencimiento('2026-06-16', HOY, 5)).toBe('por_vencer');
  });

  it('T-08: el día del vencimiento aún está por vencer', () => {
    expect(estadoVencimiento(HOY, HOY, 5)).toBe('por_vencer');
  });

  it('T-09: una fecha pasada está vencida', () => {
    expect(estadoVencimiento('2026-06-14', HOY, 5)).toBe('vencido');
  });

  it('T-10: una fecha pasada ya venció', () => {
    expect(estaVencido('2026-06-14', HOY)).toBe(true);
  });

  it('T-11: la fecha de hoy todavía no se considera vencida', () => {
    expect(estaVencido(HOY, HOY)).toBe(false);
  });
});
