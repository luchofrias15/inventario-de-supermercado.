import { ZONA_HORARIA } from '@/lib/config/tienda';
import { ErrorDeNegocio } from './errores';

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

function partesFecha(fecha: string): [number, number, number] | null {
  const coincidencia = PATRON_FECHA.exec(fecha);
  if (!coincidencia) return null;

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  if (anio < 1 || mes < 1 || mes > 12 || dia < 1) return null;

  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasPorMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dia > diasPorMes[mes - 1]!) return null;

  return [anio, mes, dia];
}

export function hoyBogota(reloj: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reloj);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

export function esFechaValida(fecha: string): boolean {
  return partesFecha(fecha) !== null;
}

export function diasEntre(desde: string, hasta: string): number {
  const inicio = partesFecha(desde);
  const fin = partesFecha(hasta);
  if (!inicio || !fin) throw new ErrorDeNegocio('DATOS_INVALIDOS');

  const diaInicio = Date.UTC(inicio[0] + 400, inicio[1] - 1, inicio[2]);
  const diaFin = Date.UTC(fin[0] + 400, fin[1] - 1, fin[2]);
  return (diaFin - diaInicio) / 86_400_000;
}
