ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(14, 2);

ALTER TABLE public.productos
  DROP CONSTRAINT IF EXISTS productos_precio_unitario_positivo;

ALTER TABLE public.productos
  ADD CONSTRAINT productos_precio_unitario_positivo
  CHECK (precio_unitario IS NULL OR precio_unitario > 0);

DROP VIEW IF EXISTS public.v_productos;

CREATE VIEW public.v_productos
WITH (security_invoker = true) AS
SELECT
  p.*,
  COALESCE((
    SELECT SUM(l.cantidad)
    FROM public.lotes l
    WHERE l.producto_id = p.id
      AND (l.fecha_vencimiento IS NULL OR l.fecha_vencimiento >= CURRENT_DATE)
  ), 0) AS stock_disponible,
  COALESCE((
    SELECT SUM(l.cantidad)
    FROM public.lotes l
    WHERE l.producto_id = p.id
  ), 0) AS stock_total
FROM public.productos p;

REVOKE ALL ON public.v_productos FROM PUBLIC, anon, authenticated;
