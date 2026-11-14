'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

const TIPOS_CUENTA = [
  { value: 'customer', label: 'Cliente', detail: 'Consultar productos e inventario.' },
  {
    value: 'store_admin',
    label: 'Administrador de tienda',
    detail: 'Crear y administrar tu propio inventario.',
  },
  {
    value: 'page_admin',
    label: 'Administrador',
    detail: 'Solicitar acceso de administrador de la página; requiere aprobación.',
  },
] as const;

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'store_admin' | 'page_admin'>(
    'customer',
  );
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, accountType, storeName }),
      });
      const result = (await response.json()) as {
        error?: string;
        confirmationRequired?: boolean;
        requestPending?: boolean;
      };
      if (!response.ok) {
        setError(result.error ?? 'No se pudo crear la cuenta.');
        return;
      }

      const estadoCuenta = result.requestPending
        ? 'Tu solicitud para administrar la página quedó pendiente de aprobación.'
        : accountType === 'store_admin'
          ? 'Tu cuenta de administrador de tienda quedó creada.'
          : 'Tu cuenta de cliente quedó creada.';
      setMensaje(
        result.confirmationRequired
          ? `${estadoCuenta} Revisa tu correo y confirma la dirección antes de iniciar sesión.`
          : `${estadoCuenta} Ya puedes iniciar sesión.`,
      );
      setPassword('');
      setConfirmacion('');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell flex items-center justify-center p-6">
      <form onSubmit={submit} className="auth-card w-full max-w-md rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-300">Elige el tipo de cuenta que quieres crear.</p>
        <fieldset className="mt-6 space-y-3">
          <legend className="text-sm font-medium">Tipo de cuenta</legend>
          {TIPOS_CUENTA.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-white/15 p-3"
            >
              <input
                type="radio"
                name="accountType"
                value={option.value}
                checked={accountType === option.value}
                onChange={() => setAccountType(option.value)}
                className="mt-1 accent-cyan-400"
              />
              <span>
                <span className="block text-sm font-semibold text-white">{option.label}</span>
                <span className="block text-xs text-slate-300">{option.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {accountType === 'store_admin' && (
          <label className="mt-4 block text-sm font-medium">
            Nombre de tu tienda
            <input
              className="auth-input mt-1 w-full rounded-lg p-3"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              maxLength={120}
              required
            />
          </label>
        )}
        <label className="mt-6 block text-sm font-medium">
          Nombre
          <input
            className="auth-input mt-1 w-full rounded-lg p-3"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            autoComplete="name"
            maxLength={120}
            required
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Correo
          <input
            className="auth-input mt-1 w-full rounded-lg p-3"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Contraseña
          <input
            className="auth-input mt-1 w-full rounded-lg p-3"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={1024}
            required
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Confirmar contraseña
          <input
            className="auth-input mt-1 w-full rounded-lg p-3"
            value={confirmacion}
            onChange={(event) => setConfirmacion(event.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={1024}
            required
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {mensaje && (
          <p role="status" className="mt-3 text-sm text-emerald-700">
            {mensaje}
          </p>
        )}
        <button
          disabled={loading}
          className="auth-primary-button mt-6 w-full rounded-lg py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
        <p className="mt-5 text-center text-sm text-slate-300">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="auth-link font-semibold underline underline-offset-4">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
