-- M2: vista con stock disponible y estado de reorden; cierre de acceso público

CREATE OR REPLACE VIEW v_productos
WITH (security_invoker = true) AS
SELECT
  p.*,
  COALESCE((SELECT SUM(l.cantidad) FROM lotes l
            WHERE l.producto_id = p.id
              AND (l.fecha_vencimiento IS NULL OR l.fecha_vencimiento >= CURRENT_DATE)), 0) AS stock_disponible,  -- RN-06 (apoyo)
  COALESCE((SELECT SUM(l.cantidad) FROM lotes l WHERE l.producto_id = p.id), 0) AS stock_total
FROM productos p;

ALTER TABLE productos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON productos, lotes, movimientos FROM anon, authenticated;
REVOKE ALL ON v_productos FROM anon, authenticated;
