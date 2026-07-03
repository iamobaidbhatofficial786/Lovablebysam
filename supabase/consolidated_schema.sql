-- =========================================================================
-- Consolidated Supabase Schema for ByPass Ai Licensing & Admin System
-- Run this in the Supabase SQL Editor.
-- =========================================================================

-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- 1. LICENSES TABLE
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key_hash text not null unique,                  -- SHA-256 hash of raw key (used by Admin Dashboard)
  license_key text unique,                               -- Plaintext key (used by basic Vercel API, optional for Admin)
  customer_name text,
  customer_email text,
  plan text check (plan in ('trial', 'monthly', 'yearly', 'lifetime')), -- Plan slug
  plan_name text not null default 'pro',                 -- Plan display name (used by Admin Dashboard)
  max_devices integer not null default 1 check (max_devices between 1 and 20),
  activation_count integer not null default 0,           -- Number of active devices
  expires_at timestamptz,
  notes text,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked', 'expired', 'inactive')),
  active boolean not null default true,
  suspended boolean not null default false,
  revoked boolean not null default false,
  expired boolean not null default false,
  admin_message text,
  support_url text,
  support_telegram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. ADMIN USERS TABLE (For Admin Dashboard Authentication)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,                           -- Bcrypt hash of admin password
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- 3. DEVICES TABLE (Legacy/Alternate Device Tracking)
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  device_hash text not null unique,
  ip_address text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 4. LICENSE DEVICES TABLE (Active Device Sessions)
create table if not exists public.license_devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  device_id text not null,                               -- Device identification hash
  device_hash text,                                      -- Alias / backup field
  extension_id text,
  extension_version text,
  user_agent text,
  activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ip_address text,
  country text,
  unique (license_id, device_id)
);

-- 5. ACTIVATIONS LOG TABLE
create table if not exists public.activations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references public.licenses(id) on delete cascade,
  device_hash text,
  action text,                                           -- 'activate', 'deactivate', 'heartbeat'
  ip_address text,
  country text,
  created_at timestamptz not null default now()
);

-- 6. SECURITY EVENTS TABLE (Threat Logs)
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references public.licenses(id) on delete set null,
  device_hash text,
  event_type text not null,                              -- e.g. 'unauthorized_access', 'limit_exceeded'
  details text,
  ip_address text,
  country text,
  created_at timestamptz not null default now()
);

-- 7. BASIC LICENSE LOGS TABLE (For compatibility with Vercel API logs)
create table if not exists public.license_logs (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references public.licenses(id) on delete set null,
  event_type text not null,
  message text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Indexes for Performance Optimization
-- =========================================================================
create index if not exists idx_licenses_hash on public.licenses(license_key_hash);
create index if not exists idx_licenses_key_plain on public.licenses(license_key);
create index if not exists idx_admin_users_email on public.admin_users(email);
create index if not exists idx_devices_license_id on public.devices(license_id);
create index if not exists idx_license_devices_license_id on public.license_devices(license_id);
create index if not exists idx_activations_license_id on public.activations(license_id);
create index if not exists idx_security_events_license_id on public.security_events(license_id);
create index if not exists idx_license_logs_license_id on public.license_logs(license_id);

-- =========================================================================
-- Security Setup: Row Level Security (RLS)
-- =========================================================================
alter table public.licenses enable row level security;
alter table public.admin_users enable row level security;
alter table public.devices enable row level security;
alter table public.license_devices enable row level security;
alter table public.activations enable row level security;
alter table public.security_events enable row level security;
alter table public.license_logs enable row level security;

-- NOTE: Dashboard endpoints and API servers interact via the Supabase Service-Role
-- key which automatically bypasses RLS policies. Do not expose this key to browsers.

-- =========================================================================
-- Initial Seed: Admin User Account Setup
-- =========================================================================
-- Default Credentials:
-- Email: admin@bypassai.com
-- Password: admin123456 (Bcrypt hash: $2a$10$jjaXWTK.31RRm2kf3vZPv.p6xKgSSqcK9Pyz4R72bhCtDE9OWilZu)

insert into public.admin_users (email, password_hash, role)
values (
  'admin@bypassai.com',
  '$2a$10$jjaXWTK.31RRm2kf3vZPv.p6xKgSSqcK9Pyz4R72bhCtDE9OWilZu',
  'admin'
)
on conflict (email) do nothing;
