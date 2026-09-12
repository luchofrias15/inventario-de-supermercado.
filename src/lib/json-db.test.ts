import { describe, expect, it } from 'vitest';
import { getAll, getById, query } from './json-db';

describe('json inventory database', () => {
  it('reads seeded products', async () => {
    const result = await getAll('products');
    expect(result.total).toBeGreaterThan(0);
    const product = await getById('products', 'prod_arroz') as ({ sku?: string } | null);
    expect(product?.sku).toBe('ARR-001');
  });
  it('queries low stock products', async () => {
    const result = await query<{ id: string; createdAt: string; updatedAt: string; stock: number; minStock: number }>('products', (p) => p.stock <= p.minStock);
    expect(result.some((product) => product.id === 'prod_leche')).toBe(true);
  });
});
