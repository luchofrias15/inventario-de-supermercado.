export const now = (): string => new Date().toISOString();

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().split('-')[0]}`;
}

export function deepClone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T;
}
