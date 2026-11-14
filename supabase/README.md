# Supabase authentication profiles

Apply the SQL migration in `migrations/20261003120000_create_profiles.sql`
using the Supabase CLI (`supabase db push`) or the Supabase Dashboard SQL
Editor.

User credentials belong to Supabase Auth (`auth.users`) and must be checked
with Supabase Auth sign-in. The migration creates `public.profiles`, linked
one-to-one to `auth.users`; it never stores passwords in the public schema.
New Auth users receive a profile automatically. Row-level security allows
authenticated users to read their own profile and update only `full_name`;
the `role` is not client-editable.

To make a profile an administrator, first create the account through Supabase
Auth, then run this statement from the Dashboard SQL Editor as a trusted
administrator, replacing the UUID with the account's Auth user ID:

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH-USER-UUID';
```

The application registration endpoint creates accounts through Supabase Auth
with the submitted name in user metadata. The `on_auth_user_created` trigger
creates each profile with the default `user` role. Email confirmation behavior
follows the Supabase Auth project settings. The login endpoint authenticates
with Supabase Auth, then reads the signed-in user's profile through the
Supabase Data API. Set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for local
development. Existing Vercel-linked `NEXT_PUBLIC_INVENTARIO_INVENTARIOSUPABASE_URL`
and `NEXT_PUBLIC_INVENTARIO_INVENTARIOSUPABASE_ANON_KEY` variables are also
recognized. The service-role key is never used by the login endpoint.
