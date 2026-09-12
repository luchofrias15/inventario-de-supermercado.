import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Mercado local</p>
        <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">Inventario claro para vender mejor.</h1>
        <p className="mt-6 max-w-xl text-lg text-slate-300">Gestiona productos, categorias y alertas de stock desde un solo lugar.</p>
        <div className="mt-10 flex gap-4">
          <Link href="/dashboard" className="rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950">Abrir inventario</Link>
          <Link href="/login" className="rounded-lg border border-slate-600 px-5 py-3 font-semibold">Acceso demo</Link>
        </div>
      </div>
    </main>
  );
}
