export interface SupabaseConfig {
  url: string;
  apiKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_INVENTARIO_INVENTARIOSUPABASE_URL;
  const apiKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_INVENTARIO_INVENTARIOSUPABASE_ANON_KEY ??
    process.env.INVENTARIO_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !apiKey) {
    throw new Error('Falta configurar la URL o la clave pública de Supabase');
  }

  return { url: url.replace(/\/+$/, ''), apiKey };
}
