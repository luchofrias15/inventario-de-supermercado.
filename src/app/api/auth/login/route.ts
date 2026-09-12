import { NextResponse } from 'next/server';
import { getAll } from '@/lib/json-db';

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const users = await getAll<{ id: string; createdAt: string; updatedAt: string; email: string; password: string; name: string; role: string }>('users');
  const user = users.data.find((item) => item.email === body.email && item.password === body.password);
  if (!user) return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  response.cookies.set('market_session', user.id, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 8, path: '/' });
  return response;
}
