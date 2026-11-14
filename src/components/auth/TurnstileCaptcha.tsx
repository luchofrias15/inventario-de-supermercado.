'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

interface TurnstileWidgetOptions {
  sitekey: string;
  action: string;
  theme: 'dark';
  language: string;
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileWidgetOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileCaptcha({
  siteKey,
  resetSignal,
  onToken,
  onError,
}: {
  siteKey: string;
  resetSignal: number;
  onToken: (token: string) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: 'signup',
      theme: 'dark',
      language: 'es',
      callback: (token) => {
        onError('');
        onToken(token);
      },
      'error-callback': () => {
        onToken('');
        onError('No se pudo verificar el CAPTCHA. Recarga el reto e inténtalo de nuevo.');
      },
      'expired-callback': () => {
        onToken('');
        onError('La verificación CAPTCHA venció. Completa el reto otra vez.');
      },
    });
  }, [onError, onToken, siteKey]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
      onToken('');
      onError('');
    }
  }, [onError, onToken, resetSignal]);

  useEffect(
    () => () => {
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
    },
    [],
  );

  return (
    <div className="mt-5 space-y-2">
      <p className="text-sm font-medium">Verificación de seguridad</p>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
        onError={() =>
          onError('No se pudo cargar el CAPTCHA. Verifica tu conexión e inténtalo de nuevo.')
        }
      />
      <div ref={containerRef} role="group" aria-label="Verificación Cloudflare Turnstile" />
      <p className="text-xs text-slate-400">Completa la verificación para crear tu cuenta.</p>
    </div>
  );
}
