import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('health endpoint', () => {
  it('returns ok and metadata', async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });
});
