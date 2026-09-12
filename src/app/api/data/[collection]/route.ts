import { NextResponse } from 'next/server';
import { z } from 'zod';
import { categorySchema, productSchema } from '../../../../../data/_schema/inventory';
import { create, getAll, getById, remove, update, JsonDBError } from '@/lib/json-db';

const schemas = { products: productSchema, categories: categorySchema } as const;
type CollectionName = keyof typeof schemas;
const inputSchema = (name: CollectionName) =>
  schemas[name] as z.ZodObject<Record<string, z.ZodTypeAny>>;
const response = (data: unknown, init?: ResponseInit) =>
  NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, init);

function errorResponse(error: unknown) {
  const code = error instanceof JsonDBError ? error.code : 'IO_ERROR';
  const status = code === 'NOT_FOUND' ? 404 : code === 'READ_ONLY' ? 503 : 400;
  return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error', code, timestamp: new Date().toISOString() }, { status });
}

async function collection(params: Promise<{ collection: string }>): Promise<CollectionName> {
  const name = (await params).collection;
  if (!(name in schemas)) throw new JsonDBError('Coleccion no encontrada', 'NOT_FOUND');
  return name as CollectionName;
}

export async function GET(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const name = await collection(params);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) return response(await getById(name, id));
    return response(await getAll(name, {
      limit: Number(url.searchParams.get('limit') ?? 100),
      offset: Number(url.searchParams.get('offset') ?? 0),
      sortBy: url.searchParams.get('sortBy') ?? undefined,
      sortOrder: url.searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc',
    }));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const name = await collection(params);
    const body = await request.json();
    const parsed = inputSchema(name).omit({ id: true, createdAt: true, updatedAt: true }).safeParse(body);
    if (!parsed.success) return errorResponse(new Error(parsed.error.issues.map((item: z.ZodIssue) => item.message).join(', ')));
    return response(await create(name, parsed.data as never), { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const name = await collection(params);
    const body = await request.json() as { id?: string } & Record<string, unknown>;
    if (!body.id) return errorResponse(new Error('id es requerido'));
    const parsed = inputSchema(name).omit({ id: true, createdAt: true, updatedAt: true }).partial().safeParse(body);
    if (!parsed.success) return errorResponse(new Error('Datos invalidos'));
    return response(await update(name, body.id, parsed.data as never));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const name = await collection(params);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return errorResponse(new Error('id es requerido'));
    await remove(name, id);
    return response({ id, removed: true });
  } catch (error) { return errorResponse(error); }
}
