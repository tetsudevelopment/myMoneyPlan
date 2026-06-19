-- =====================================================================
--  FIX: atar las deudas (y demás datos) al usuario autenticado + RLS
--  Síntoma: las deudas le aparecían a todos => RLS estaba desactivado.
--  Pega TODO en Supabase -> SQL Editor -> Run. Seguro de correr varias veces.
-- =====================================================================

-- 1) Reasignar TODAS las filas actuales al usuario dueño (app de un solo dueño)
update public.deudas              set user_id = 'e55700c2-4973-4f54-b8b6-10f10caa4ae1';
update public.movimientos         set user_id = 'e55700c2-4973-4f54-b8b6-10f10caa4ae1';
update public.intereses_aplicados set user_id = 'e55700c2-4973-4f54-b8b6-10f10caa4ae1';
update public.config              set user_id = 'e55700c2-4973-4f54-b8b6-10f10caa4ae1';

-- 2) Activar Row Level Security (sin esto, todos ven todo)
alter table public.deudas              enable row level security;
alter table public.movimientos         enable row level security;
alter table public.intereses_aplicados enable row level security;
alter table public.config              enable row level security;

-- 3) Recrear las políticas (idempotente): cada quien SOLO ve y maneja lo suyo
-- --- DEUDAS ---
drop policy if exists "deudas: ver solo las mias"  on public.deudas;
drop policy if exists "deudas: crear las mias"     on public.deudas;
drop policy if exists "deudas: editar las mias"    on public.deudas;
drop policy if exists "deudas: borrar las mias"    on public.deudas;
create policy "deudas: ver solo las mias" on public.deudas for select using (auth.uid() = user_id);
create policy "deudas: crear las mias"    on public.deudas for insert with check (auth.uid() = user_id);
create policy "deudas: editar las mias"   on public.deudas for update using (auth.uid() = user_id);
create policy "deudas: borrar las mias"   on public.deudas for delete using (auth.uid() = user_id);

-- --- MOVIMIENTOS ---
drop policy if exists "movs: ver solo los mios" on public.movimientos;
drop policy if exists "movs: crear los mios"    on public.movimientos;
drop policy if exists "movs: editar los mios"   on public.movimientos;
drop policy if exists "movs: borrar los mios"   on public.movimientos;
create policy "movs: ver solo los mios" on public.movimientos for select using (auth.uid() = user_id);
create policy "movs: crear los mios"    on public.movimientos for insert with check (auth.uid() = user_id);
create policy "movs: editar los mios"   on public.movimientos for update using (auth.uid() = user_id);
create policy "movs: borrar los mios"   on public.movimientos for delete using (auth.uid() = user_id);

-- --- INTERESES_APLICADOS ---
drop policy if exists "intereses: ver solo los mios" on public.intereses_aplicados;
drop policy if exists "intereses: crear los mios"    on public.intereses_aplicados;
drop policy if exists "intereses: borrar los mios"   on public.intereses_aplicados;
create policy "intereses: ver solo los mios" on public.intereses_aplicados for select using (auth.uid() = user_id);
create policy "intereses: crear los mios"    on public.intereses_aplicados for insert with check (auth.uid() = user_id);
create policy "intereses: borrar los mios"   on public.intereses_aplicados for delete using (auth.uid() = user_id);

-- --- CONFIG ---
drop policy if exists "config: ver la mia"   on public.config;
drop policy if exists "config: crear la mia" on public.config;
drop policy if exists "config: editar la mia" on public.config;
create policy "config: ver la mia"    on public.config for select using (auth.uid() = user_id);
create policy "config: crear la mia"  on public.config for insert with check (auth.uid() = user_id);
create policy "config: editar la mia" on public.config for update using (auth.uid() = user_id);

-- 4) (Opcional) Verifica que RLS quedó activo:
-- select relname, relrowsecurity from pg_class
-- where relname in ('deudas','movimientos','intereses_aplicados','config');
-- relrowsecurity debe ser true (t) en las 4.
