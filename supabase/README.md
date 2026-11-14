# Supabase authentication profiles

Apply the SQL migrations in `migrations/` in filename order using the
project's migration script (`npm run db:migrar` with
`INVENTARIO_POSTGRES_URL` configured) or the Supabase Dashboard SQL Editor.
The migrations add separate store inventories, account approval, unit prices,
and home-delivery orders.

Customers and store administrators can open the store directory and browse each
store's active product catalog. Page administrators can switch stores to manage
each inventory; store administrators can only manage their own store. Product
codes are unique within a store, so different stores may carry the same item
code. Products require a unit price in Colombian pesos; existing products keep
an unset price until an administrator updates or recreates them.

Customers can order products for home delivery from a single store's catalog.
Orders are stored as pending and do not reserve or reduce stock until a store
administrator accepts them; acceptance checks availability and decrements lots
using FEFO in one transaction. Customers may select cash on delivery or manual
transfer coordination. The delivery fee and transfer account details are
coordinated with the store and are not calculated or processed by an online
payment gateway.

User credentials belong to Supabase Auth (`auth.users`) and must be checked
with Supabase Auth sign-in. The migration creates `public.profiles`, linked
one-to-one to `auth.users`; it never stores passwords in the public schema.
New Auth users receive a profile automatically. Row-level security allows
authenticated users to read their own profile and update only `full_name`;
the `role` is not client-editable.

The registration form supports three account types. Customers receive the
`user` role and can only browse inventory. Store administrators receive the
`store_admin` role and a separate store; inventory writes are scoped to that
store. Page administrator requests remain ordinary `user` accounts until an
existing administrator approves them from the bell icon beside their email.
The profile role and store assignment are never client-editable.

To bootstrap the first page administrator, create the account through
Supabase Auth, then run this statement from the Dashboard SQL Editor as a
trusted administrator, replacing the UUID with the account's Auth user ID:

```sql
update public.profiles
set role = 'admin',
    store_id = (select id from public.stores where is_default)
where id = 'AUTH-USER-UUID';
```

The application registration endpoint creates accounts through Supabase Auth
with the submitted account type in user metadata. The
`on_auth_user_created` trigger creates profiles, provisions stores, and records
page administrator requests without granting global privileges. Email
confirmation behavior follows the Supabase Auth project settings. The login
endpoint authenticates with Supabase Auth, then reads the signed-in user's
profile through the Supabase Data API. Set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for local
development. Existing Vercel-linked `NEXT_PUBLIC_INVENTARIO_INVENTARIOSUPABASE_URL`
and `NEXT_PUBLIC_INVENTARIO_INVENTARIOSUPABASE_ANON_KEY` variables are also
recognized. The service-role key is never used by the login endpoint.
