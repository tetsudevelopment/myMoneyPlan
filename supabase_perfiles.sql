-- =====================================================================
--  MI PLAN — Perfiles de usuario + almacenamiento de avatares
--  Pega TODO esto en Supabase -> SQL Editor -> New query -> Run.
--  Es seguro correrlo varias veces (idempotente).
-- =====================================================================


-- =====================================================================
--  1) TABLA: perfiles
--     Un registro por usuario (nombre, teléfono y URL del avatar).
--     El correo y la contraseña los maneja Supabase Auth, no esta tabla.
-- =====================================================================
create table if not exists public.perfiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  nombre         text not null default '',
  telefono       text not null default '',
  avatar_url     text,                              -- URL pública del avatar en Storage
  actualizado_en timestamptz not null default now()
);

comment on table public.perfiles is 'Datos de perfil del usuario (nombre, telefono, avatar)';

-- Activar Row Level Security
alter table public.perfiles enable row level security;

-- Políticas: cada quien solo ve y edita SU perfil
drop policy if exists "perfiles: ver el mio"    on public.perfiles;
drop policy if exists "perfiles: crear el mio"  on public.perfiles;
drop policy if exists "perfiles: editar el mio" on public.perfiles;

create policy "perfiles: ver el mio"
  on public.perfiles for select
  using (auth.uid() = user_id);

create policy "perfiles: crear el mio"
  on public.perfiles for insert
  with check (auth.uid() = user_id);

create policy "perfiles: editar el mio"
  on public.perfiles for update
  using (auth.uid() = user_id);

-- Trigger: refrescar "actualizado_en" en cada cambio
create or replace function public.tocar_perfil_actualizado()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_perfiles_actualizado on public.perfiles;
create trigger trg_perfiles_actualizado
  before update on public.perfiles
  for each row execute function public.tocar_perfil_actualizado();


-- =====================================================================
--  2) STORAGE: bucket "avatars" para las fotos de perfil
--     Público para LECTURA (cualquiera con la URL ve la imagen),
--     pero SUBIR/EDITAR/BORRAR solo el dueño, dentro de su carpeta.
--     Convención de ruta que usa la app:  {user_id}/avatar.jpg
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Políticas sobre los archivos del bucket (storage.objects ya tiene RLS)
drop policy if exists "avatars: lectura publica"   on storage.objects;
drop policy if exists "avatars: subir el mio"      on storage.objects;
drop policy if exists "avatars: actualizar el mio" on storage.objects;
drop policy if exists "avatars: borrar el mio"     on storage.objects;

-- Lectura pública de cualquier archivo del bucket
create policy "avatars: lectura publica"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Subir: solo usuarios autenticados y dentro de su propia carpeta (user_id)
create policy "avatars: subir el mio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reemplazar el propio archivo
create policy "avatars: actualizar el mio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Borrar el propio archivo
create policy "avatars: borrar el mio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- =====================================================================
--  FIN
-- =====================================================================
