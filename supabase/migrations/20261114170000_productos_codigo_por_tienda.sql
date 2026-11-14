ALTER TABLE public.productos
  DROP CONSTRAINT IF EXISTS productos_codigo_unico;

CREATE UNIQUE INDEX IF NOT EXISTS productos_store_codigo_unico
  ON public.productos (store_id, codigo);
