-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects Table
create table if not exists public.projects (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default 'default',
  created_at timestamp with time zone default now(),
  
  constraint projects_pkey primary key (id)
);

-- Tasks Table
create table if not exists public.tasks (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  color text default 'default',
  completed boolean default false,
  date text,
  end_date text,
  notes text,
  subtasks jsonb default '[]'::jsonb,
  project_id text references public.projects(id) on delete set null,
  repeat_pattern text,
  reminder_date text,
  google_calendar_event_id text,
  time_slot jsonb,
  "order" double precision default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint tasks_pkey primary key (id)
);

-- Migration: Add order column if it doesn't exist (run this if you have existing data)
-- ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "order" double precision default 0;

-- Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- Create Policies
-- Projects policies
create policy "Users can view their own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert their own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete their own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Tasks policies
create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- User Settings Table (stores preferences, module configs, etc.)
create table if not exists public.user_settings (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preferences jsonb default '{
    "theme": "system",
    "weekStartsOn": 1,
    "defaultView": "week",
    "language": "en"
  }'::jsonb,
  module_configs jsonb default '[]'::jsonb,
  reminder_settings jsonb default '{}'::jsonb,
  inbox_name text default 'Inbox',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint user_settings_pkey primary key (id),
  constraint user_settings_user_id_unique unique (user_id)
);

-- Enable RLS for user_settings
alter table public.user_settings enable row level security;

-- User Settings policies
create policy "Users can view their own settings" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own settings" on public.user_settings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own settings" on public.user_settings
  for delete using (auth.uid() = user_id);

-- Function to auto-create user_settings on signup
create or replace function public.handle_new_user_settings()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create settings when a new user signs up
drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute procedure public.handle_new_user_settings();

