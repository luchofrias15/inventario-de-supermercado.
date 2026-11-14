import type { SelectHTMLAttributes } from 'react';

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  error?: string;
}

export function Selector({ etiqueta, error, id, className = '', children, ...props }: SelectorProps) {
  if (!id) throw new Error('Selector requiere un id para asociar su etiqueta.');

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-texto">
        {etiqueta}
      </label>
      <select
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`min-h-11 w-full rounded-lg border border-borde bg-superficie px-3 text-texto shadow-sm outline-none transition focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/20 ${className}`}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-vencido">
          {error}
        </p>
      )}
    </div>
  );
}
