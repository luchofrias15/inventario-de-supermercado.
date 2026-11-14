ALTER TABLE public.store_orders
  DROP CONSTRAINT IF EXISTS store_orders_status_check;

ALTER TABLE public.store_orders
  ADD CONSTRAINT store_orders_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));
