import { diasEntre } from './fechas';

export type EstadoVencimiento = 'vigente' | 'por_vencer' | 'vencido';

export function estadoVencimiento(
  fechaVencimiento: string,
  hoy: string,
  diasAviso: number,
): EstadoVencimiento {
  const dias = diasEntre(hoy, fechaVencimiento);
  if (dias < 0) return 'vencido';
  if (dias <= diasAviso) return 'por_vencer';
  return 'vigente';
}

export function estaVencido(fechaVencimiento: string, hoy: string): boolean {
  return diasEntre(hoy, fechaVencimiento) < 0;
}
