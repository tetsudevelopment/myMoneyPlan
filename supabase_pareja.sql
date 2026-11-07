-- =====================================================================
--  MI PLAN — Plan en pareja (espacio compartido entre 2 personas)
--  Pega TODO en Supabase -> SQL Editor -> Run. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
--  TABLAS
-- ---------------------------------------------------------------------
create table if not exists public.espacios (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null default 'Nuestro plan',
  codigo     text not null unique,
  creado_por uuid not null references auth.users(id) on delete cascade,
  creado_en  timestamptz not null default now()
);

create table if not exists public.espacio_miembros (
  espacio_id uuid not null references public.espacios(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  nombre     text not null default '',
  ingreso    numeric(14,2) not null default 0,
  unido_en   timestamptz not null default now(),
  primary key (espacio_id, user_id)
);

create table if not exists public.espacio_gastos (
  id            uuid primary key default gen_random_uuid(),
  espacio_id    uuid not null references public.espacios(id) on delete cascade,
  nombre        text not null,
  icono         text not null default '🏠',
  color         text not null default '#1D6E56',
  monto_mensual numeric(14,2) not null default 0,
  creado_en     timestamptz not null default now()
);

create table if not exists public.espacio_deudas (
  id            uuid primary key default gen_random_uuid(),
  espacio_id    uuid not null references public.espacios(id) on delete cascade,
  nombre        text not null,
  tipo          text not null default 'credito' check (tipo in ('tarjeta','credito')),
  saldo_inicial numeric(14,2) not null,
  saldo_actual  numeric(14,2) not null,
  cuota_mensual numeric(14,2) not null default 0,
  tasa_ea       numeric(6,3) not null default 0,
  orden_ataque  integer not null default 99,
  creado_en     timestamptz not null default now()
);

create index if not exists idx_esp_miembros_user on public.espacio_miembros(user_id);
create index if not exists idx_esp_gastos_esp on public.espacio_gastos(espacio_id);
create index if not exists idx_esp_deudas_esp on public.espacio_deudas(espacio_id);

-- ---------------------------------------------------------------------
--  FUNCIÓN DE MEMBRESÍA (SECURITY DEFINER para evitar recursión de RLS)
-- ---------------------------------------------------------------------
create or replace function public.es_miembro(p_espacio uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.espacio_miembros
    where espacio_id = p_espacio and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
--  RLS
-- ---------------------------------------------------------------------
alter table public.espacios          enable row level security;
alter table public.espacio_miembros  enable row level security;
alter table public.espacio_gastos    enable row level security;
alter table public.espacio_deudas    enable row level security;

-- espacios: ver si eres miembro
drop policy if exists "espacios: ver" on public.espacios;
create policy "espacios: ver" on public.espacios for select using (public.es_miembro(id));

-- miembros: ver los del espacio al que perteneces; editar SOLO tu propia fila
drop policy if exists "miembros: ver"    on public.espacio_miembros;
drop policy if exists "miembros: editar" on public.espacio_miembros;
create policy "miembros: ver"    on public.espacio_miembros for select using (public.es_miembro(espacio_id));
create policy "miembros: editar" on public.espacio_miembros for update using (user_id = auth.uid());

-- gastos: CRUD si eres miembro del espacio
drop policy if exists "esp_gastos: ver"    on public.espacio_gastos;
drop policy if exists "esp_gastos: crear"  on public.espacio_gastos;
drop policy if exists "esp_gastos: editar" on public.espacio_gastos;
drop policy if exists "esp_gastos: borrar" on public.espacio_gastos;
create policy "esp_gastos: ver"    on public.espacio_gastos for select using (public.es_miembro(espacio_id));
create policy "esp_gastos: crear"  on public.espacio_gastos for insert with check (public.es_miembro(espacio_id));
create policy "esp_gastos: editar" on public.espacio_gastos for update using (public.es_miembro(espacio_id));
create policy "esp_gastos: borrar" on public.espacio_gastos for delete using (public.es_miembro(espacio_id));

-- deudas compartidas: CRUD si eres miembro
drop policy if exists "esp_deudas: ver"    on public.espacio_deudas;
drop policy if exists "esp_deudas: crear"  on public.espacio_deudas;
drop policy if exists "esp_deudas: editar" on public.espacio_deudas;
drop policy if exists "esp_deudas: borrar" on public.espacio_deudas;
create policy "esp_deudas: ver"    on public.espacio_deudas for select using (public.es_miembro(espacio_id));
create policy "esp_deudas: crear"  on public.espacio_deudas for insert with check (public.es_miembro(espacio_id));
create policy "esp_deudas: editar" on public.espacio_deudas for update using (public.es_miembro(espacio_id));
create policy "esp_deudas: borrar" on public.espacio_deudas for delete using (public.es_miembro(espacio_id));

-- ---------------------------------------------------------------------
--  RPCs: crear y unirse (SECURITY DEFINER). Un usuario = un solo espacio.
-- ---------------------------------------------------------------------
create or replace function public.crear_espacio(p_nombre text)
returns table(id uuid, codigo text)
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_cod text;
begin
  if exists (select 1 from espacio_miembros where user_id = auth.uid()) then
    raise exception 'Ya perteneces a un espacio';
  end if;
  v_cod := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into espacios(nombre, codigo, creado_por)
    values (coalesce(nullif(btrim(p_nombre), ''), 'Nuestro plan'), v_cod, auth.uid())
    returning espacios.id into v_id;
  insert into espacio_miembros(espacio_id, user_id) values (v_id, auth.uid());
  return query select v_id, v_cod;
end;
$$;

create or replace function public.unirse_a_espacio(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_count int;
begin
  select e.id into v_id from espacios e where e.codigo = upper(btrim(p_codigo));
  if v_id is null then raise exception 'Código inválido'; end if;
  if exists (select 1 from espacio_miembros where espacio_id = v_id and user_id = auth.uid()) then
    return v_id;
  end if;
  if exists (select 1 from espacio_miembros where user_id = auth.uid()) then
    raise exception 'Ya perteneces a un espacio';
  end if;
  select count(*) into v_count from espacio_miembros where espacio_id = v_id;
  if v_count >= 2 then raise exception 'El espacio ya está completo (2 personas)'; end if;
  insert into espacio_miembros(espacio_id, user_id) values (v_id, auth.uid());
  return v_id;
end;
$$;

grant execute on function public.crear_espacio(text)   to authenticated;
grant execute on function public.unirse_a_espacio(text) to authenticated;
grant execute on function public.es_miembro(uuid)       to authenticated;

-- Postgres grants EXECUTE to PUBLIC by default: restrict the RPCs to signed-in users.
revoke execute on function public.crear_espacio(text)    from public, anon;
revoke execute on function public.unirse_a_espacio(text) from public, anon;
revoke execute on function public.es_miembro(uuid)       from public, anon;
