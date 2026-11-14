import { describe, expect, it } from 'vitest';
import { paraReordenar } from '@/lib/reglas/alertas';

describe('alertas de reorden', () => {
  it('T-01: stock 11 supera el punto de reorden', () => {
    expect(paraReordenar(11, 10)).toBe(false);
  });

  it('T-02: stock 10 activa el reorden de forma inclusiva', () => {
    expect(paraReordenar(10, 10)).toBe(true);
  });

  it('T-03: stock 9 activa el reorden', () => {
    expect(paraReordenar(9, 10)).toBe(true);
  });

  it('T-04: stock 0 activa el reorden', () => {
    expect(paraReordenar(0, 10)).toBe(true);
  });
});
