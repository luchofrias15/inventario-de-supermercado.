import { z } from 'zod';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { exigirAdminPagina, exigirSesion, obtenerTokenSesion } from '@/lib/auth/sesion';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
});

interface SolicitudAdmin {
  id: string;
  full_name: string;
  email: string;
  requested_at: string;
}

async function llamarRpc<T>(funcion: string, body: Record<string, unknown>): Promise<T> {
  const config = getSupabaseConfig();
  const token = await obtenerTokenSesion();
  if (!token) throw new ErrorDeNegocio('NO_AUTORIZADO');

  let respuesta: Response;
  try {
    respuesta = await fetch(`${config.url}/rest/v1/rpc/${funcion}`, {
      method: 'POST',
      headers: {
        apikey: config.apiKey,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(`No se pudo contactar a Supabase para ${funcion}.`, { cause: error });
  }

  if (!respuesta.ok) {
    throw new Error(`Supabase rechazó ${funcion} (HTTP ${respuesta.status}).`);
  }
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

export const GET = conManejoDeErrores(async () => {
  exigirAdminPagina(await exigirSesion());
  const solicitudes = await llamarRpc<SolicitudAdmin[]>('list_pending_page_admin_requests', {});
  return responderOk(solicitudes);
});

export const POST = conManejoDeErrores(async (request: Request) => {
  exigirAdminPagina(await exigirSesion());
  const { id, decision } = await leerCuerpo(request, decisionSchema);
  await llamarRpc<void>('review_page_admin_request', {
    request_id: id,
    decision,
  });
  return responderOk({ id, decision });
});
