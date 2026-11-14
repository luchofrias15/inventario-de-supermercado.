import type { InputHTMLAttributes } from 'react';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
}

export function Campo({ etiqueta, error, id, className = '', ...props }: CampoProps) {
  if (!id) throw new Error('Campo requiere un id para asociar su etiqueta.');

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-texto">
        {etiqueta}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`min-h-11 w-full rounded-lg border border-borde bg-superficie px-3 text-texto shadow-sm outline-none transition placeholder:text-texto-suave/70 focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/20 ${className}`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-vencido">
          {error}
        </p>
      )}
    </div>
  );
}
