-- =====================================================================
--  MI PLAN — Esquema de base de datos (Supabase / PostgreSQL)
--  App de seguimiento de deudas, gastos e ingresos
--  Autor: Brayan Esteban Marín
-- =====================================================================
--  Cómo usar este archivo:
--  1. Entra a tu proyecto en Supabase
--  2. Menú lateral -> SQL Editor -> New query
--  3. Pega TODO este archivo y dale "Run"
--  4. Listo: tablas, seguridad y datos iniciales quedan creados
-- =====================================================================


-- =====================================================================
--  TABLA 1: deudas
--  Cada fila es una deuda (tarjeta o crédito). El saldo se actualiza
--  con cada abono y con la aplicación mensual de intereses.
-- =====================================================================
create table if not exists public.deudas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  nombre        text not null,
  tipo          text not null check (tipo in ('tarjeta','credito')),
  saldo_inicial numeric(14,2) not null,         -- saldo cuando empezó el plan
  saldo_actual  numeric(14,2) not null,         -- saldo vivo hoy
  cuota_mensual numeric(14,2) not null default 0,
  tasa_ea       numeric(6,3) not null default 0, -- tasa efectiva anual en %
  orden_ataque  integer not null default 99,    -- 1 = se ataca primero
  activa        boolean not null default true,   -- false cuando queda en 0
  creada_en     timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

comment on table public.deudas is 'Deudas del usuario (tarjetas y creditos) con saldo vivo';
comment on column public.deudas.orden_ataque is 'Orden de la estrategia bola de nieve: 1 se paga primero';


-- =====================================================================
--  TABLA 2: movimientos
--  Registro de todo lo que pasa: gastos, ingresos y abonos a deudas.
--  Un abono ademas referencia a que deuda fue (deuda_id).
-- =====================================================================
create table if not exists public.movimientos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tipo        text not null check (tipo in ('gasto','ingreso','abono')),
  monto       numeric(14,2) not null check (monto > 0),
  descripcion text,
  categoria   text,                              -- solo para gastos
  deuda_id    uuid references public.deudas(id) on delete set null, -- solo para abonos
  fecha       date not null default current_date,
  creado_en   timestamptz not null default now()
);

comment on table public.movimientos is 'Gastos, ingresos y abonos del usuario';
comment on column public.movimientos.categoria is 'Categoria del gasto (mercado, gasolina, gaming, etc)';
comment on column public.movimientos.deuda_id is 'Si es abono, a que deuda se aplico';


-- =====================================================================
--  TABLA 3: intereses_aplicados
--  Lleva control de en que meses ya se aplicaron intereses, para no
--  aplicarlos dos veces el mismo mes (el problema que detectaste).
-- =====================================================================
create table if not exists public.intereses_aplicados (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  mes           text not null,                   -- formato 'YYYY-MM' ej '2026-06'
  total_interes numeric(14,2) not null default 0,
  aplicado_en   timestamptz not null default now(),
  unique (user_id, mes)                          -- un solo registro por mes por usuario
);

comment on table public.intereses_aplicados is 'Control de meses donde ya se sumaron intereses';


-- =====================================================================
--  TABLA 4: config
--  Configuracion personal del usuario (ingreso, ocio, etc).
--  Una sola fila por usuario.
-- =====================================================================
create table if not exists public.config (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  ingreso_mensual   numeric(14,2) not null default 0,
  presupuesto_ocio  numeric(14,2) not null default 0,
  actualizada_en    timestamptz not null default now()
);

comment on table public.config is 'Configuracion financiera personal del usuario';


-- =====================================================================
--  INDICES — para que las consultas sean rapidas
-- =====================================================================
create index if not exists idx_deudas_user      on public.deudas(user_id);
create index if not exists idx_movs_user         on public.movimientos(user_id);
create index if not exists idx_movs_fecha        on public.movimientos(user_id, fecha desc);
create index if not exists idx_movs_deuda        on public.movimientos(deuda_id);
create index if not exists idx_intereses_user    on public.intereses_aplicados(user_id);


-- =====================================================================
--  SEGURIDAD: ROW LEVEL SECURITY (RLS)
--  ESTO ES LO MAS IMPORTANTE. Sin esto, cualquier usuario podria ver
--  los datos de otro. Con esto, cada quien SOLO ve y edita lo suyo.
-- =====================================================================

-- Activar RLS en todas las tablas
alter table public.deudas               enable row level security;
alter table public.movimientos          enable row level security;
alter table public.intereses_aplicados  enable row level security;
alter table public.config               enable row level security;

-- --- Politicas para DEUDAS ---
create policy "deudas: ver solo las mias"
  on public.deudas for select
  using (auth.uid() = user_id);

create policy "deudas: crear las mias"
  on public.deudas for insert
  with check (auth.uid() = user_id);

create policy "deudas: editar las mias"
  on public.deudas for update
  using (auth.uid() = user_id);

create policy "deudas: borrar las mias"
  on public.deudas for delete
  using (auth.uid() = user_id);

-- --- Politicas para MOVIMIENTOS ---
create policy "movs: ver solo los mios"
  on public.movimientos for select
  using (auth.uid() = user_id);

create policy "movs: crear los mios"
  on public.movimientos for insert
  with check (auth.uid() = user_id);

create policy "movs: editar los mios"
  on public.movimientos for update
  using (auth.uid() = user_id);

create policy "movs: borrar los mios"
  on public.movimientos for delete
  using (auth.uid() = user_id);

-- --- Politicas para INTERESES_APLICADOS ---
create policy "intereses: ver solo los mios"
  on public.intereses_aplicados for select
  using (auth.uid() = user_id);

create policy "intereses: crear los mios"
  on public.intereses_aplicados for insert
  with check (auth.uid() = user_id);

create policy "intereses: borrar los mios"
  on public.intereses_aplicados for delete
  using (auth.uid() = user_id);

-- --- Politicas para CONFIG ---
create policy "config: ver la mia"
  on public.config for select
  using (auth.uid() = user_id);

create policy "config: crear la mia"
  on public.config for insert
  with check (auth.uid() = user_id);

create policy "config: editar la mia"
  on public.config for update
  using (auth.uid() = user_id);


-- =====================================================================
--  FUNCION AUTOMATICA: actualizar "actualizada_en" al editar una deuda
-- =====================================================================
create or replace function public.tocar_actualizada_en()
returns trigger as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_deudas_actualizada
  before update on public.deudas
  for each row execute function public.tocar_actualizada_en();


-- =====================================================================
--  FUNCION OPCIONAL: registrar abono y descontar saldo en una sola
--  operacion (transaccion segura). La PWA puede llamarla con:
--  supabase.rpc('registrar_abono', { p_deuda: id, p_monto: 500000 })
-- =====================================================================
create or replace function public.registrar_abono(p_deuda uuid, p_monto numeric)
returns void as $$
declare
  v_user uuid := auth.uid();
begin
  -- crear el movimiento de abono
  insert into public.movimientos (user_id, tipo, monto, deuda_id, descripcion)
  values (v_user, 'abono', p_monto, p_deuda, 'Abono a deuda');

  -- descontar del saldo de la deuda (sin bajar de 0)
  update public.deudas
  set saldo_actual = greatest(0, saldo_actual - p_monto),
      activa = (greatest(0, saldo_actual - p_monto) > 0)
  where id = p_deuda and user_id = v_user;
end;
$$ language plpgsql security definer;


-- =====================================================================
--  DATOS INICIALES (SEED) — tus 9 deudas reales
--  IMPORTANTE: descomenta este bloque y reemplaza 'TU-USER-ID-AQUI'
--  por tu user id real (lo encuentras en Supabase -> Authentication ->
--  tu usuario -> copiar el UID). Solo corre esto UNA vez.
-- =====================================================================

insert into public.deudas (user_id, nombre, tipo, saldo_inicial, saldo_actual, cuota_mensual, tasa_ea, orden_ataque) values
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'Banco Bogotá LATAM',        'tarjeta', 1522706,  1522706,  123000, 24.33, 1),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'BBVA Oro',                  'tarjeta', 3816360,  3816360,  189906, 28.79, 2),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'Nu',                        'tarjeta', 4186590,  4186590,  846984, 25.00, 3),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'BBVA AQUA',                 'tarjeta', 8129239,  8129239,  335784, 28.17, 4),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'Banco Bogotá Libre Destino','credito', 4210461,  4210461,  130061, 26.08, 5),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'BBVA Préstamo 1',           'credito', 3925012,  3925012,  147586, 26.35, 6),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'Claro Xiaomi',              'credito', 3852103,  3852103,  233451, 25.19, 7),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'BBVA Préstamo 2',           'credito', 3888700,  3888700,  125824, 21.55, 8),
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 'Finecoop',                  'credito', 16451674, 16451674, 722428, 21.00, 9);

insert into public.config (user_id, ingreso_mensual, presupuesto_ocio) values
  ('e55700c2-4973-4f54-b8b6-10f10caa4ae1', 5800000, 120000);


-- =====================================================================
--  FIN DEL ESQUEMA
-- =====================================================================
