import { Insignia, type TonoInsignia } from '@/components/ui/Insignia';

export type EstadoTienda = 'normal' | 'para_reordenar' | 'por_vencer' | 'vencido' | 'inactivo';

const ETIQUETAS: Record<EstadoTienda, string> = {
  normal: 'Normal',
  para_reordenar: 'Para reordenar',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  inactivo: 'Inactivo',
};

const TONOS: Record<EstadoTienda, TonoInsignia> = {
  normal: 'normal',
  para_reordenar: 'reorden',
  por_vencer: 'reorden',
  vencido: 'vencido',
  inactivo: 'inactivo',
};

export function InsigniaEstado({ estado }: { estado: EstadoTienda }) {
  return <Insignia tono={TONOS[estado]}>{ETIQUETAS[estado]}</Insignia>;
}
