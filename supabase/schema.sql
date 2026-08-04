-- Personal Finance Dashboard schema
-- Run this in the Supabase SQL editor for your project

create table if not exists plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'frank', -- single-user for now
  item_id text not null unique,
  access_token text not null, -- encrypted at rest by Supabase; never exposed to frontend
  institution_name text,
  created_at timestamptz default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'frank',
  item_id text references plaid_items(item_id) on delete cascade,
  account_id text not null unique, -- Plaid account_id
  name text,
  official_name text,
  type text, -- depository, credit, investment, loan
  subtype text,
  mask text,
  current_balance numeric,
  available_balance numeric,
  iso_currency_code text default 'USD',
  updated_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'frank',
  account_id text references accounts(account_id) on delete cascade,
  transaction_id text not null unique, -- Plaid transaction_id
  name text,
  merchant_name text,
  amount numeric, -- positive = money out, per Plaid convention
  category text,
  pending boolean default false,
  date date,
  is_recurring boolean default false,
  created_at timestamptz default now()
);

create table if not exists investment_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'frank',
  account_id text references accounts(account_id) on delete cascade,
  security_id text,
  ticker text,
  name text,
  quantity numeric,
  institution_value numeric,
  cost_basis numeric,
  updated_at timestamptz default now()
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'frank',
  payee text not null,
  amount numeric,
  due_day int, -- day of month, 1-31
  next_due_date date,
  pay_url text, -- link to biller's payment portal
  source text default 'manual', -- 'manual' or 'detected'
  linked_transaction_name text, -- for matching detected recurring txns
  is_paid_this_cycle boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_transactions_date on transactions(date desc);
create index if not exists idx_bills_due_date on bills(next_due_date);
