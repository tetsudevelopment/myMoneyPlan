// =====================================================================
//  Cliente de Supabase (capa nube, opcional)
//  Las credenciales se leen SIEMPRE de import.meta.env (archivo .env),
//  nunca van hardcodeadas. Si faltan, la app corre en modo solo-local.
// =====================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn(
    'Faltan credenciales de Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
      'La app funcionará solo en modo local.',
  )
}

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

/** true si hay un cliente de Supabase configurado. */
export const hayNube = (): boolean => supabase !== null
