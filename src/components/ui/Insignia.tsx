import type { HTMLAttributes, ReactNode } from 'react';

export type TonoInsignia = 'neutro' | 'normal' | 'reorden' | 'vencido' | 'inactivo';

interface InsigniaProps extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoInsignia;
  children: ReactNode;
}

const TONOS: Record<TonoInsignia, string> = {
  neutro: 'bg-fondo text-texto-suave',
  normal: 'bg-normal/10 text-normal',
  reorden: 'bg-reorden/10 text-reorden',
  vencido: 'bg-vencido/10 text-vencido',
  inactivo: 'bg-inactivo/10 text-inactivo',
};

export function Insignia({ tono = 'neutro', className = '', children, ...props }: InsigniaProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONOS[tono]} ${className}`}
    >
      {children}
    </span>
  );
}
