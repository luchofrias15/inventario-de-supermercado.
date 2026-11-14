import type { ReactNode } from 'react';

interface EstadoVacioProps {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}

export function EstadoVacio({ titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div className="rounded-2xl border border-dashed border-borde bg-superficie px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-texto">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-texto-suave">{descripcion}</p>
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}
