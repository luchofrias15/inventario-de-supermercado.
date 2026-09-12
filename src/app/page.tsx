import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home-shell min-h-screen overflow-hidden px-5 py-5 text-white sm:px-8 lg:px-12">
      <nav className="home-nav mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Inventario Mercado, inicio">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="text-sm font-bold tracking-[0.16em] text-slate-100">INVENTARIO<span className="text-teal-300">.</span></span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-slate-400 sm:flex">
          <a href="#beneficios" className="transition hover:text-white">Beneficios</a>
          <a href="#como-funciona" className="transition hover:text-white">Cómo funciona</a>
          <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:border-teal-300/50 hover:bg-white/5">Iniciar sesión</Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 pb-20 pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pb-28 lg:pt-28">
        <div className="home-hero-glow" aria-hidden="true" />
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_12px_#5eead4]" />
            Control simple, decisiones rápidas
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.8rem]">
            Tu mercado, <span className="home-gradient-text">siempre bajo control.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Una vista clara de tus productos, existencias y alertas para que puedas
            reponer a tiempo y vender con confianza.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="home-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold text-slate-950">
              Abrir inventario <span aria-hidden="true">→</span>
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 font-semibold text-white transition hover:border-white/30 hover:bg-white/10">
              Ver acceso demo
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
            <span className="flex -space-x-2" aria-hidden="true">
              <span className="avatar bg-amber-300">LM</span>
              <span className="avatar bg-sky-300">CR</span>
              <span className="avatar bg-violet-300">JP</span>
            </span>
            <span><strong className="text-slate-200">Hecho para equipos pequeños</strong><br />sin complicaciones.</span>
          </div>
        </div>

        <div className="relative z-10" id="como-funciona">
          <div className="dashboard-preview rounded-3xl border border-white/10 bg-slate-900/80 p-3 shadow-2xl shadow-teal-950/30 backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-[#101a28] p-4 sm:p-5">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Resumen de hoy</p>
                  <p className="mt-1 text-xl font-bold text-white">Hola, administrador</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-300/15 text-sm font-bold text-teal-200">AM</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="preview-card rounded-2xl p-4"><p className="text-xs text-slate-400">Productos</p><p className="mt-2 text-2xl font-bold">128</p><p className="mt-1 text-xs text-teal-300">+12 este mes</p></div>
                <div className="preview-card rounded-2xl p-4"><p className="text-xs text-slate-400">Valor stock</p><p className="mt-2 text-2xl font-bold">$24.8k</p><p className="mt-1 text-xs text-slate-400">Actualizado ahora</p></div>
              </div>
              <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Nivel de inventario</p><span className="text-xs text-slate-400">Últimos 7 días</span></div>
                <div className="flex h-24 items-end gap-2">
                  {[42, 58, 48, 72, 62, 82, 94].map((height, index) => <span key={index} className="chart-bar flex-1 rounded-t-md" style={{ height: `${height}%` }} />)}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Hoy</span></div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/8 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/15 text-amber-200">!</span>
                <div><p className="text-xs font-semibold text-amber-100">3 productos necesitan reposición</p><p className="mt-0.5 text-[11px] text-slate-400">Revisa tus alertas de stock</p></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-white/10 bg-slate-800/90 p-4 shadow-xl backdrop-blur sm:block">
            <p className="text-[11px] text-slate-400">Disponibilidad</p>
            <p className="mt-1 text-lg font-bold text-teal-300">94.8% <span className="text-xs font-normal text-slate-400">↑ 4.2%</span></p>
          </div>
        </div>

      </section>

      <section id="beneficios" className="mx-auto grid max-w-7xl gap-4 border-t border-white/10 py-8 sm:grid-cols-3">
        {[
          ['01', 'Todo en un vistazo', 'Métricas claras para entender tu operación al instante.'],
          ['02', 'Alertas inteligentes', 'Detecta faltantes antes de que afecten tus ventas.'],
          ['03', 'Listo para crecer', 'Una base simple que acompaña el ritmo de tu negocio.'],
        ].map(([number, title, description]) => (
          <div key={number} className="group rounded-2xl p-4 transition hover:bg-white/[0.04]">
            <p className="text-xs font-bold tracking-[0.2em] text-teal-300">{number}</p>
            <h2 className="mt-3 text-base font-bold text-white">{title}</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">{description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
