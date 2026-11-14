import type { HTMLAttributes, ReactNode } from 'react';

export type TipoAviso = 'info' | 'exito' | 'advertencia' | 'error';

interface AvisoProps extends HTMLAttributes<HTMLDivElement> {
  tipo?: TipoAviso;
  children: ReactNode;
}

const ESTILOS: Record<TipoAviso, string> = {
  info: 'border-primario/20 bg-primario-suave text-primario',
  exito: 'border-normal/20 bg-normal/10 text-normal',
  advertencia: 'border-reorden/20 bg-reorden/10 text-reorden',
  error: 'border-vencido/20 bg-vencido/10 text-vencido',
};

export function Aviso({ tipo = 'info', className = '', children, ...props }: AvisoProps) {
  return (
    <div
      {...props}
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border p-4 text-sm ${ESTILOS[tipo]} ${className}`}
    >
      {children}
    </div>
  );
}
