-- M1: tablas del inventario de tienda

CREATE TABLE IF NOT EXISTS productos (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo         VARCHAR(40)   NOT NULL,
  nombre         VARCHAR(160)  NOT NULL,
  categoria      VARCHAR(16)   NOT NULL,                 -- 'perecedero' | 'no_perecedero' (RN-04)
  proveedor      VARCHAR(120),
  punto_reorden  INTEGER       NOT NULL DEFAULT 10,      -- fijo (RN-01)
  activo         BOOLEAN       NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT productos_codigo_unico  UNIQUE (codigo),                       -- RN-09
  CONSTRAINT productos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1),
  CONSTRAINT productos_categoria_valida CHECK (categoria IN ('perecedero', 'no_perecedero')),  -- RN-09
  CONSTRAINT productos_reorden_no_neg CHECK (punto_reorden >= 0)
);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);

CREATE TABLE IF NOT EXISTS lotes (
  id                 BIGSERIAL     PRIMARY KEY,
  producto_id        UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,  -- RN-11
  cantidad           INTEGER       NOT NULL,                 -- stock restante de este lote
  fecha_entrada      DATE          NOT NULL,
  fecha_vencimiento  DATE,                                   -- solo perecederos (RN-04)
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT lotes_cantidad_no_neg CHECK (cantidad >= 0),    -- se descuenta hasta 0 (RN-03)
  CONSTRAINT lotes_fechas_coherentes CHECK (
    fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_entrada)  -- RN-12
);
CREATE INDEX IF NOT EXISTS idx_lotes_producto ON lotes (producto_id, fecha_vencimiento);

CREATE TABLE IF NOT EXISTS movimientos (
  id           BIGSERIAL     PRIMARY KEY,
  producto_id  UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tipo         VARCHAR(8)    NOT NULL,                     -- 'entrada' | 'salida'
  cantidad     INTEGER       NOT NULL,
  fecha        DATE          NOT NULL,                     -- RN-10
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT mov_tipo_valido        CHECK (tipo IN ('entrada', 'salida')),
  CONSTRAINT mov_cantidad_positiva  CHECK (cantidad > 0)   -- RN-08
);
CREATE INDEX IF NOT EXISTS idx_mov_producto ON movimientos (producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_mov_tipo     ON movimientos (tipo, fecha);

CREATE OR REPLACE FUNCTION tienda_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON productos;
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION tienda_actualizar_updated_at();
