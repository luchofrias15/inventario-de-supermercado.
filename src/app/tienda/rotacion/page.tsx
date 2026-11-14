import Link from 'next/link';
import { Aviso } from '@/components/ui/Aviso';
import { Campo } from '@/components/ui/Campo';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { TablaRotacion } from '@/components/tienda/TablaRotacion';
import { exigirTiendaOperativa, obtenerTienda, reporteRotacion } from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';
import { esquemaRango } from '@/lib/validacion/esquemas';
import { redirect } from 'next/navigation';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

type ParametrosBusqueda = {
  desde?: string | string[];
  hasta?: string | string[];
  storeId?: string | string[];
};

function valorUnico(valor: string | string[] | undefined): string | undefined {
  return typeof valor === 'string' ? valor : undefined;
}

export default async function RotacionPage({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const sesion = await exigirSesion();
  if (sesion.role === 'user') redirect('/tienda');
  const parametros = await searchParams;
  const requestedStoreId = valorUnico(parametros.storeId);
  const storeId = await exigirTiendaOperativa(sesion, requestedStoreId);
  const tienda = await obtenerTienda(storeId);
  const hoy = hoyBogota();
  const rangoInicial = { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy };
  const parametrosAusentes = parametros.desde === undefined && parametros.hasta === undefined;
  const candidato = parametrosAusentes
    ? rangoInicial
    : {
        desde: valorUnico(parametros.desde) ?? '',
        hasta: valorUnico(parametros.hasta) ?? '',
      };
  const validacion = esquemaRango.safeParse(candidato);
  const filas = validacion.success
    ? await reporteRotacion(validacion.data.desde, validacion.data.hasta, storeId)
    : null;
  const rangoFormulario = validacion.success
    ? validacion.data
    : {
        desde: valorUnico(parametros.desde) || rangoInicial.desde,
        hasta: valorUnico(parametros.hasta) || rangoInicial.hasta,
      };

  return (
    <>
      <div>
        <Link href={`/tienda?storeId=${encodeURIComponent(storeId)}`} className="text-sm font-medium text-primario hover:underline">
          Volver a {tienda?.nombre}
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Reporte de rotación</h1>
        <p className="mt-2 text-texto-suave">
          Productos ordenados por unidades vendidas en el periodo elegido.
        </p>
      </div>
      <Tarjeta>
        <form action="/tienda/rotacion" method="get" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="storeId" value={storeId} />
          <Campo
            key={`desde-${rangoFormulario.desde}`}
            id="rotacion-desde"
            name="desde"
            etiqueta="Desde"
            type="date"
            defaultValue={rangoFormulario.desde ?? ''}
            required
          />
          <Campo
            key={`hasta-${rangoFormulario.hasta}`}
            id="rotacion-hasta"
            name="hasta"
            etiqueta="Hasta"
            type="date"
            defaultValue={rangoFormulario.hasta ?? ''}
            required
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            Consultar
          </button>
        </form>
        {!validacion.success && (
          <Aviso tipo="error" className="mt-4">
            {validacion.error.issues[0]?.message ?? 'Selecciona un rango de fechas válido.'}
          </Aviso>
        )}
      </Tarjeta>
      {filas && (
        <Tarjeta className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Ventas del periodo</h2>
            <p className="mt-1 text-sm text-texto-suave">
              {rangoFormulario.desde} a {rangoFormulario.hasta}
            </p>
          </div>
          <TablaRotacion filas={filas} />
        </Tarjeta>
      )}
    </>
  );
}
