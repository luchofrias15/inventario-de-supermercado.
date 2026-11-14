'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!result.ok) {
        const body = (await result.json()) as { error?: string };
        setError(body.error ?? 'No se pudo iniciar sesion');
        return;
      }
      router.push('/tienda');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Acceso a Inventario</h1>
        <p className="mt-2 text-sm text-slate-500">Inicia sesion con tu cuenta de Inventario Mercado.</p>
        <label className="mt-6 block text-sm font-medium">
          Correo
          <input className="mt-1 w-full rounded border p-3" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Contrasena
          <input className="mt-1 w-full rounded border p-3" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="mt-6 w-full rounded bg-slate-900 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? 'Iniciando sesion...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
