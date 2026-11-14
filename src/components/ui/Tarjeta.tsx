import type { HTMLAttributes, ReactNode } from 'react';

interface TarjetaProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Tarjeta({ children, className = '', ...props }: TarjetaProps) {
  return (
    <section
      {...props}
      className={`rounded-2xl border border-borde bg-superficie p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
