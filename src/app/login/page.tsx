'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@mercado.local');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!result.ok) { setError('Credenciales invalidas'); return; }
    router.push('/dashboard');
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"><h1 className="text-2xl font-bold text-slate-900">Acceso a Inventario</h1><p className="mt-2 text-sm text-slate-500">Demo: admin@mercado.local / demo</p><label className="mt-6 block text-sm font-medium">Correo<input className="mt-1 w-full rounded border p-3" value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></label><label className="mt-4 block text-sm font-medium">Contrasena<input className="mt-1 w-full rounded border p-3" value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></label>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button className="mt-6 w-full rounded bg-slate-900 py-3 font-semibold text-white">Entrar</button></form></main>;
}
