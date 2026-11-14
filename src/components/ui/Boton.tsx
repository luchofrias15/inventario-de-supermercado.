import type { ButtonHTMLAttributes, ReactNode } from 'react';

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  cargando?: boolean;
  children: ReactNode;
}

const ESTILOS: Record<VarianteBoton, string> = {
  primario: 'bg-primario text-white hover:bg-primario/90',
  secundario: 'border border-borde bg-superficie text-texto hover:bg-fondo',
  peligro: 'bg-vencido text-white hover:bg-vencido/90',
  fantasma: 'text-texto-suave hover:bg-fondo',
};

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  children,
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-60 ${ESTILOS[variante]} ${className}`}
    >
      {children}
    </button>
  );
}
