-- =====================================================================
--  MI PLAN — Categorías de gasto personalizadas
--  Pega TODO en Supabase -> SQL Editor -> Run. Idempotente.
-- =====================================================================

create table if not exists public.categorias (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nombre     text not null,
  icono      text not null default '📦',
  color      text not null default '#5F5E5A',
  creado_en  timestamptz not null default now()
);
create index if not exists idx_categorias_user on public.categorias(user_id);

alter table public.categorias enable row level security;

drop policy if exists "categorias: ver"    on public.categorias;
drop policy if exists "categorias: crear"  on public.categorias;
drop policy if exists "categorias: editar" on public.categorias;
drop policy if exists "categorias: borrar" on public.categorias;
create policy "categorias: ver"    on public.categorias for select using (auth.uid() = user_id);
create policy "categorias: crear"  on public.categorias for insert with check (auth.uid() = user_id);
create policy "categorias: editar" on public.categorias for update using (auth.uid() = user_id);
create policy "categorias: borrar" on public.categorias for delete using (auth.uid() = user_id);
