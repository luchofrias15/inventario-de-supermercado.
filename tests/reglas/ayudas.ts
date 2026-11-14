import { expect } from 'vitest';
import type { CodigoError } from '@/lib/reglas/errores';

export async function esperarCodigo(
  fn: () => unknown | Promise<unknown>,
  codigo: CodigoError,
): Promise<void> {
  await expect(Promise.resolve().then(fn)).rejects.toMatchObject({ codigo });
}
