-- =====================================================================
--  MI PLAN — Monedas (USD aparte de COP) y entidad por bolsillo
--  Pega TODO en Supabase -> SQL Editor -> Run. Idempotente.
--  Requiere haber corrido antes supabase_schema.sql y supabase_ahorro.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
--  BOLSILLOS: moneda del saldo (COP o USD) y entidad donde está el dinero.
-- ---------------------------------------------------------------------
alter table public.bolsillos
  add column if not exists moneda  text not null default 'COP',
  add column if not exists entidad text;

alter table public.bolsillos drop constraint if exists bolsillos_moneda_check;
alter table public.bolsillos
  add constraint bolsillos_moneda_check check (moneda in ('COP','USD'));

-- ---------------------------------------------------------------------
--  MOVIMIENTOS: moneda del movimiento (solo los ingresos pueden ser USD),
--  bolsillo USD destino y tasa (COP por 1 USD) en conversiones.
-- ---------------------------------------------------------------------
alter table public.movimientos
  add column if not exists moneda      text not null default 'COP',
  add column if not exists bolsillo_id uuid references public.bolsillos(id) on delete set null,
  add column if not exists tasa        numeric(14,4);

alter table public.movimientos drop constraint if exists movimientos_moneda_check;
alter table public.movimientos
  add constraint movimientos_moneda_check check (moneda in ('COP','USD'));

create index if not exists idx_movs_bolsillo on public.movimientos(bolsillo_id);

comment on column public.bolsillos.moneda      is 'Moneda del saldo del bolsillo: COP o USD';
comment on column public.bolsillos.entidad     is 'Banco o billetera donde esta el dinero';
comment on column public.movimientos.moneda    is 'COP o USD (solo ingresos pueden ser USD)';
comment on column public.movimientos.bolsillo_id is 'Bolsillo USD que recibio un ingreso en dolares';
comment on column public.movimientos.tasa      is 'COP por 1 USD en una conversion a pesos';
