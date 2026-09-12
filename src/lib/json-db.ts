import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { BaseRecord, Collection, QueryOptions } from './types';
import { generateId, now } from './utils';

export class JsonDBError extends Error {
  constructor(message: string, public readonly code: 'NOT_FOUND' | 'DUPLICATE_ID' | 'IO_ERROR' | 'READ_ONLY') {
    super(message);
    this.name = 'JsonDBError';
  }
}

const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), 'data'));
const locks = new Map<string, Promise<void>>();
const prefixFor = (name: string): string => name === 'categories' ? 'cat' : name === 'products' ? 'prod' : 'rec';

export function resolveCollectionPath(name: string): string {
  if (!/^[a-z]+$/.test(name)) throw new JsonDBError('Coleccion invalida', 'NOT_FOUND');
  return path.join(dataDir, `${name}.json`);
}

export async function readCollection<T extends BaseRecord>(name: string): Promise<Collection<T>> {
  try {
    const raw = await fs.readFile(resolveCollectionPath(name), 'utf8');
    return JSON.parse(raw) as Collection<T>;
  } catch {
    throw new JsonDBError(`Coleccion no encontrada: ${name}`, 'NOT_FOUND');
  }
}

async function writeCollection<T extends BaseRecord>(name: string, collection: Collection<T>): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new JsonDBError('Almacenamiento de solo lectura', 'READ_ONLY');
  const file = resolveCollectionPath(name);
  const previous = locks.get(file) ?? Promise.resolve();
  const next = previous.then(async () => {
    await fs.mkdir(path.join(dataDir, '_backups'), { recursive: true });
    try { await fs.copyFile(file, path.join(dataDir, '_backups', `${name}_${Date.now()}.json`)); } catch { /* first write */ }
    collection._meta.lastModified = now();
    await fs.writeFile(file, JSON.stringify(collection, null, 2), 'utf8');
  });
  locks.set(file, next);
  await next;
  if (locks.get(file) === next) locks.delete(file);
}

export async function getAll<T extends BaseRecord>(name: string, options: QueryOptions = {}) {
  const collection = await readCollection<T>(name);
  const sorted = [...collection.records].sort((a, b) => {
    if (!options.sortBy) return 0;
    const av = String((a as Record<string, unknown>)[options.sortBy] ?? '');
    const bv = String((b as Record<string, unknown>)[options.sortBy] ?? '');
    return options.sortOrder === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
  });
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 100;
  return { data: sorted.slice(offset, offset + limit), total: sorted.length, limit, offset };
}

export async function getById<T extends BaseRecord>(name: string, id: string): Promise<T | null> {
  const { records } = await readCollection<T>(name);
  return records.find((record) => record.id === id) ?? null;
}

export async function create<T extends BaseRecord>(name: string, input: Omit<T, keyof BaseRecord>): Promise<T> {
  const collection = await readCollection<T>(name);
  const record = { ...input, id: generateId(prefixFor(name)), createdAt: now(), updatedAt: now() } as T;
  if (collection.records.some((item) => item.id === record.id)) throw new JsonDBError('ID duplicado', 'DUPLICATE_ID');
  collection.records.push(record);
  await writeCollection(name, collection);
  return record;
}

export async function update<T extends BaseRecord>(name: string, id: string, patch: Partial<Omit<T, keyof BaseRecord>>): Promise<T> {
  const collection = await readCollection<T>(name);
  const index = collection.records.findIndex((item) => item.id === id);
  if (index < 0) throw new JsonDBError('Registro no encontrado', 'NOT_FOUND');
  const current = collection.records[index] as T;
  const updated = { ...current, ...patch, id, updatedAt: now() } as T;
  collection.records[index] = updated;
  await writeCollection(name, collection);
  return updated;
}

export async function remove(name: string, id: string): Promise<void> {
  const collection = await readCollection(name);
  const records = collection.records.filter((item) => item.id !== id);
  if (records.length === collection.records.length) throw new JsonDBError('Registro no encontrado', 'NOT_FOUND');
  collection.records = records;
  await writeCollection(name, collection);
}

export async function query<T extends BaseRecord>(name: string, predicate: (record: T) => boolean): Promise<T[]> {
  const { records } = await readCollection<T>(name);
  return records.filter(predicate);
}

export async function count(name: string): Promise<number> {
  return (await readCollection(name)).records.length;
}
