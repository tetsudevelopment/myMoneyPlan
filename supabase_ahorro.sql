-- =====================================================================
--  MI PLAN — Ahorro (bolsillos) y Préstamos (dinero prestado)
--  Pega TODO en Supabase -> SQL Editor -> Run. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
--  BOLSILLOS (ahorro): cada fila es un bolsillo con su saldo.
-- ---------------------------------------------------------------------
create table if not exists public.bolsillos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nombre     text not null,
  saldo      numeric(14,2) not null default 0,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_bolsillos_user on public.bolsillos(user_id);

-- ---------------------------------------------------------------------
--  PRESTAMOS (dinero prestado): a quién, cuánto, cuánto te ha devuelto.
--  Pendiente por cobrar = monto - abonado.
-- ---------------------------------------------------------------------
create table if not exists public.prestamos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  persona    text not null,
  monto      numeric(14,2) not null,
  abonado    numeric(14,2) not null default 0,
  fecha      date not null default current_date,
  nota       text,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_prestamos_user on public.prestamos(user_id);

-- ---------------------------------------------------------------------
--  RLS: cada quien solo ve y maneja lo suyo
-- ---------------------------------------------------------------------
alter table public.bolsillos enable row level security;
alter table public.prestamos enable row level security;

drop policy if exists "bolsillos: ver"    on public.bolsillos;
drop policy if exists "bolsillos: crear"  on public.bolsillos;
drop policy if exists "bolsillos: editar" on public.bolsillos;
drop policy if exists "bolsillos: borrar" on public.bolsillos;
create policy "bolsillos: ver"    on public.bolsillos for select using (auth.uid() = user_id);
create policy "bolsillos: crear"  on public.bolsillos for insert with check (auth.uid() = user_id);
create policy "bolsillos: editar" on public.bolsillos for update using (auth.uid() = user_id);
create policy "bolsillos: borrar" on public.bolsillos for delete using (auth.uid() = user_id);

drop policy if exists "prestamos: ver"    on public.prestamos;
drop policy if exists "prestamos: crear"  on public.prestamos;
drop policy if exists "prestamos: editar" on public.prestamos;
drop policy if exists "prestamos: borrar" on public.prestamos;
create policy "prestamos: ver"    on public.prestamos for select using (auth.uid() = user_id);
create policy "prestamos: crear"  on public.prestamos for insert with check (auth.uid() = user_id);
create policy "prestamos: editar" on public.prestamos for update using (auth.uid() = user_id);
create policy "prestamos: borrar" on public.prestamos for delete using (auth.uid() = user_id);
