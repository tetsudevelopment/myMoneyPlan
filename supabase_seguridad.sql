-- =====================================================================
--  MI PLAN — Security hardening (Supabase advisors)
--  Paste ALL into Supabase -> SQL Editor -> Run. Idempotent.
-- =====================================================================

-- Fixed search_path on functions (lint 0011_function_search_path_mutable).
alter function public.tocar_actualizada_en()        set search_path = public;
alter function public.tocar_perfil_actualizado()    set search_path = public;
alter function public.registrar_abono(uuid, numeric) set search_path = public;

-- registrar_abono is SECURITY DEFINER and no longer used by the app
-- (abonos are insert + update with client ids). Nobody may call it via the API.
revoke execute on function public.registrar_abono(uuid, numeric) from public, anon, authenticated;
