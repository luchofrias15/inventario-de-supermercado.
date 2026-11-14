'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
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
    <main className="auth-shell flex items-center justify-center p-6">
      <form onSubmit={submit} className="auth-card w-full max-w-md rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white">Acceso a Inventario</h1>
        <p className="mt-2 text-sm text-slate-300">Inicia sesion con tu cuenta de Inventario Mercado.</p>
        <label className="mt-6 block text-sm font-medium">
          Correo
          <input className="auth-input mt-1 w-full rounded-lg p-3" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Contrasena
          <input className="auth-input mt-1 w-full rounded-lg p-3" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="auth-primary-button mt-6 w-full rounded-lg py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Iniciando sesion...' : 'Entrar'}
        </button>
        <p className="mt-5 text-center text-sm text-slate-300">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="auth-link font-semibold underline underline-offset-4">
            Crear cuenta
          </Link>
        </p>
      </form>
    </main>
  );
}
