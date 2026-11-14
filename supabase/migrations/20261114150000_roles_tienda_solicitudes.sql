CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stores_name_not_empty CHECK (char_length(btrim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS stores_single_default
  ON public.stores (is_default)
  WHERE is_default;

INSERT INTO public.stores (name, is_default)
VALUES ('Inventario principal', true)
ON CONFLICT (is_default) WHERE is_default DO NOTHING;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stores FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'store_admin', 'user'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores (id) ON DELETE SET NULL;

UPDATE public.profiles
SET store_id = (SELECT id FROM public.stores WHERE is_default)
WHERE role = 'admin' AND store_id IS NULL;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS store_id UUID;

UPDATE public.productos
SET store_id = (SELECT id FROM public.stores WHERE is_default)
WHERE store_id IS NULL;

ALTER TABLE public.productos
  ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE public.productos
  DROP CONSTRAINT IF EXISTS productos_store_id_fkey;

ALTER TABLE public.productos
  ADD CONSTRAINT productos_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores (id) ON DELETE RESTRICT;

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

CREATE TABLE IF NOT EXISTS public.page_admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.page_admin_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.page_admin_requests FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_role TEXT;
  new_store_id UUID;
BEGIN
  requested_role := new.raw_user_meta_data ->> 'account_type';

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    ),
    CASE WHEN requested_role = 'store_admin' THEN 'store_admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;

  IF requested_role = 'store_admin' THEN
    INSERT INTO public.stores (name, owner_id)
    VALUES (
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'store_name'), ''),
        'Tienda de ' || coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email)
      ),
      new.id
    )
    ON CONFLICT (owner_id) DO UPDATE
      SET name = EXCLUDED.name
    RETURNING id INTO new_store_id;

    UPDATE public.profiles
    SET role = 'store_admin', store_id = new_store_id
    WHERE id = new.id;
  ELSIF requested_role = 'page_admin' THEN
    INSERT INTO public.page_admin_requests (user_id, full_name, email)
    VALUES (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
      coalesce(new.email, '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_pending_page_admin_requests()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  requested_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT requests.id, requests.full_name, requests.email, requests.requested_at
  FROM public.page_admin_requests AS requests
  WHERE requests.status = 'pending'
  ORDER BY requests.requested_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_page_admin_request(
  request_id UUID,
  decision TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  SELECT user_id INTO requester_id
  FROM public.page_admin_requests
  WHERE id = request_id AND status = 'pending'
  FOR UPDATE;
  IF requester_id IS NULL THEN
    RAISE EXCEPTION 'request not found or already reviewed';
  END IF;

  UPDATE public.page_admin_requests
  SET status = decision, reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = request_id;

  IF decision = 'approved' THEN
    UPDATE public.profiles
    SET role = 'admin',
        store_id = (SELECT stores.id FROM public.stores WHERE stores.is_default)
    WHERE id = requester_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.list_pending_page_admin_requests() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_page_admin_request(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_pending_page_admin_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_page_admin_request(UUID, TEXT) TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

INSERT INTO public.stores (name, owner_id)
SELECT
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'store_name'), ''),
    'Tienda de ' || coalesce(
      nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
      users.email
    )
  ),
  users.id
FROM auth.users AS users
WHERE users.raw_user_meta_data ->> 'account_type' = 'store_admin'
ON CONFLICT (owner_id) DO NOTHING;

UPDATE public.profiles AS profiles
SET role = 'store_admin', store_id = stores.id
FROM auth.users AS users
JOIN public.stores AS stores ON stores.owner_id = users.id
WHERE profiles.id = users.id
  AND users.raw_user_meta_data ->> 'account_type' = 'store_admin'
  AND profiles.role = 'user';

INSERT INTO public.page_admin_requests (user_id, full_name, email)
SELECT
  users.id,
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''), ''),
  coalesce(users.email, '')
FROM auth.users AS users
WHERE users.raw_user_meta_data ->> 'account_type' = 'page_admin'
ON CONFLICT (user_id) DO NOTHING;
