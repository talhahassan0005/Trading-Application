-- Trynex backend schema (Supabase / PostgreSQL)
--
-- Shared by the mobile app (mobile-app/) and the admin panel (admin-panel-web/).
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to re-run: every object is created with "if not exists" / "or replace".
--
-- Security model
--   * Every signed-in person has a row in public.profiles (created by a trigger on sign-up).
--   * role = 'user'  -> mobile app customer; can only read/update their own data.
--   * role = 'admin' -> staff; can read everyone and act through the admin_* functions.
--   * Sensitive columns (role, status, kyc_status, balance, ...) can only change through
--     the security-definer functions below, never by a direct client UPDATE.
--   * KYC files live in the private "kyc-documents" storage bucket under <user id>/...

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create sequence if not exists public.account_no_seq start 10000001;

create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  account_no         bigint not null unique default nextval('public.account_no_seq'),
  email              text not null,
  name               text not null default '',
  role               text not null default 'user' check (role in ('user', 'admin')),
  status             text not null default 'active' check (status in ('active', 'frozen')),
  kyc_status         text not null default 'unverified'
                       check (kyc_status in ('unverified', 'pending', 'verified', 'rejected')),
  nickname           text not null default '',
  first_name         text not null default '',
  last_name          text not null default '',
  date_of_birth      date,
  country            text,
  currency           text not null default 'USD',
  address            text not null default '',
  balance            numeric(14, 2) not null default 0,
  -- Sandbox-only setting used by the admin panel's demo/paper-trading controls.
  demo_trade_outcome text not null default 'moderate' check (demo_trade_outcome in ('profit', 'moderate', 'loss')),
  created_at         timestamptz not null default now()
);

create table if not exists public.kyc_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  document_type    text not null check (document_type in ('passport', 'national_id', 'driver_license')),
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles (id) on delete set null
);

create table if not exists public.kyc_documents (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.kyc_submissions (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          text not null check (type in ('passport', 'national_id', 'driver_license', 'id_front', 'id_back', 'selfie', 'proof_of_address')),
  label         text not null,
  storage_path  text not null,
  uploaded_at   timestamptz not null default now()
);

create table if not exists public.account_deletion_requests (
  id          uuid primary key default gen_random_uuid(),
  -- Kept (set null) after the account is deleted, so the request stays as an audit record.
  user_id     uuid references public.profiles (id) on delete set null,
  email       text not null,
  user_name   text not null default '',
  account_no  bigint,
  reason      text not null default '',
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references public.profiles (id) on delete set null
);

create index if not exists kyc_submissions_status_idx on public.kyc_submissions (status, created_at);
create index if not exists kyc_documents_submission_idx on public.kyc_documents (submission_id);
create index if not exists deletion_requests_status_idx on public.account_deletion_requests (status, created_at);

-- Only one open KYC submission / deletion request per user at a time.
create unique index if not exists kyc_one_pending_per_user
  on public.kyc_submissions (user_id) where status = 'pending';
create unique index if not exists deletion_one_pending_per_user
  on public.account_deletion_requests (user_id) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active');
$$;

create or replace function public.require_admin()
returns void
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
end;
$$;

-- New auth user -> profile row. Sign-up metadata (country, currency) comes from the app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, country, currency)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'country', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'currency', ''), 'USD')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.kyc_submissions enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.account_deletion_requests enable row level security;

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: active user updates own" on public.profiles;
create policy "profiles: active user updates own" on public.profiles
  for update to authenticated
  using (id = auth.uid() and status = 'active')
  with check (id = auth.uid());

-- Users may only edit their personal-data columns; everything else goes through functions.
revoke update on public.profiles from authenticated, anon;
grant update (nickname, first_name, last_name, date_of_birth, country, address) on public.profiles to authenticated;

drop policy if exists "kyc_submissions: read own or admin" on public.kyc_submissions;
create policy "kyc_submissions: read own or admin" on public.kyc_submissions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "kyc_documents: read own or admin" on public.kyc_documents;
create policy "kyc_documents: read own or admin" on public.kyc_documents
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "deletion: read own or admin" on public.account_deletion_requests;
create policy "deletion: read own or admin" on public.account_deletion_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- No direct insert/update/delete policies on the KYC and deletion tables:
-- writes happen only inside the security-definer functions below.

-- ---------------------------------------------------------------------------
-- Storage: private bucket for KYC files, one folder per user
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-documents', 'kyc-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "kyc files: active user uploads to own folder" on storage.objects;
create policy "kyc files: active user uploads to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_user()
  );

drop policy if exists "kyc files: read own or admin" on storage.objects;
create policy "kyc files: read own or admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "kyc files: admin deletes" on storage.objects;
create policy "kyc files: admin deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'kyc-documents' and public.is_admin());

-- ---------------------------------------------------------------------------
-- User actions (mobile app)
-- ---------------------------------------------------------------------------

-- documents: [{"type": "id_front", "label": "ID — front", "path": "<uid>/..."}]
create or replace function public.submit_kyc(document_type text, documents jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sub_id uuid;
  doc jsonb;
begin
  if uid is null or not public.is_active_user() then
    raise exception 'Your account cannot submit verification right now' using errcode = '42501';
  end if;
  if exists (select 1 from profiles where id = uid and kyc_status in ('pending', 'verified')) then
    raise exception 'Verification is already submitted' using errcode = 'P0001';
  end if;
  if jsonb_typeof(documents) <> 'array' or jsonb_array_length(documents) = 0 then
    raise exception 'At least one document is required' using errcode = '22023';
  end if;

  insert into kyc_submissions (user_id, document_type) values (uid, document_type) returning id into sub_id;

  for doc in select * from jsonb_array_elements(documents) loop
    if split_part(doc ->> 'path', '/', 1) <> uid::text then
      raise exception 'Invalid document path' using errcode = '42501';
    end if;
    insert into kyc_documents (submission_id, user_id, type, label, storage_path)
    values (sub_id, uid, doc ->> 'type', coalesce(doc ->> 'label', doc ->> 'type'), doc ->> 'path');
  end loop;

  update profiles set kyc_status = 'pending' where id = uid;
  return sub_id;
end;
$$;

create or replace function public.request_account_deletion(reason text default '')
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  p profiles;
  req_id uuid;
begin
  select * into p from profiles where id = auth.uid();
  if p.id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if exists (select 1 from account_deletion_requests where user_id = p.id and status = 'pending') then
    raise exception 'A deletion request is already pending' using errcode = 'P0001';
  end if;

  insert into account_deletion_requests (user_id, email, user_name, account_no, reason)
  values (p.id, p.email, trim(p.first_name || ' ' || p.last_name), p.account_no, coalesce(reason, ''))
  returning id into req_id;
  return req_id;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language sql security definer set search_path = public
as $$
  delete from account_deletion_requests where user_id = auth.uid() and status = 'pending';
$$;

-- ---------------------------------------------------------------------------
-- Admin actions (admin panel)
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_user_status(target uuid, new_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform require_admin();
  update profiles set status = new_status where id = target and role = 'user';
end;
$$;

create or replace function public.admin_set_demo_outcome(targets uuid[], outcome text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform require_admin();
  update profiles set demo_trade_outcome = outcome where id = any (targets) and role = 'user';
end;
$$;

create or replace function public.admin_decide_kyc(submission uuid, approve boolean, reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target uuid;
begin
  perform require_admin();
  update kyc_submissions
     set status = case when approve then 'approved' else 'rejected' end,
         rejection_reason = case when approve then null else reason end,
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = submission and status = 'pending'
   returning user_id into target;

  if target is null then
    raise exception 'This KYC case was already decided' using errcode = 'P0001';
  end if;
  update profiles set kyc_status = case when approve then 'verified' else 'rejected' end where id = target;
end;
$$;

-- Approving deletes the auth user; profile, KYC rows and the user's sessions cascade away.
-- The admin panel removes the user's KYC files from storage before calling this.
create or replace function public.admin_decide_deletion(request uuid, approve boolean)
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare
  target uuid;
begin
  perform require_admin();
  update account_deletion_requests
     set status = case when approve then 'approved' else 'rejected' end,
         decided_at = now(),
         decided_by = auth.uid()
   where id = request and status = 'pending'
   returning user_id into target;

  if target is null then
    raise exception 'This request was already decided' using errcode = 'P0001';
  end if;
  if approve then
    if exists (select 1 from public.profiles where id = target and role = 'admin') then
      raise exception 'Admin accounts cannot be deleted from here' using errcode = '42501';
    end if;
    delete from auth.users where id = target;
  end if;
end;
$$;

-- Functions are callable by signed-in users only; each one checks its own permissions.
revoke execute on function public.submit_kyc(text, jsonb) from public, anon;
revoke execute on function public.request_account_deletion(text) from public, anon;
revoke execute on function public.cancel_account_deletion() from public, anon;
revoke execute on function public.admin_set_user_status(uuid, text) from public, anon;
revoke execute on function public.admin_set_demo_outcome(uuid[], text) from public, anon;
revoke execute on function public.admin_decide_kyc(uuid, boolean, text) from public, anon;
revoke execute on function public.admin_decide_deletion(uuid, boolean) from public, anon;
grant execute on function public.submit_kyc(text, jsonb) to authenticated;
grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
grant execute on function public.admin_set_user_status(uuid, text) to authenticated;
grant execute on function public.admin_set_demo_outcome(uuid[], text) to authenticated;
grant execute on function public.admin_decide_kyc(uuid, boolean, text) to authenticated;
grant execute on function public.admin_decide_deletion(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: the app reacts instantly to freeze / KYC decisions on its own row
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
