// =====================================================================
//  Plan en pareja — capa de datos (solo nube; requiere sesión).
//  Usa el cliente de Supabase y el usuario activo de lib/sync.
// =====================================================================

import type { Espacio, EspacioGasto, EspacioMiembro } from '../types'
import { supabase } from './supabase'
import { usuarioActivo } from './sync'

export interface DatosEspacio {
  espacio: Espacio
  miembros: EspacioMiembro[]
  gastos: EspacioGasto[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Carga el espacio del usuario (si pertenece a uno) con miembros y gastos. */
export async function cargarEspacio(): Promise<DatosEspacio | null> {
  const u = usuarioActivo()
  if (!supabase || !u) return null
  const { data: mems, error } = await supabase
    .from('espacio_miembros')
    .select('espacio_id')
    .eq('user_id', u.id)
    .limit(1)
  if (error || !mems || mems.length === 0) return null
  const espId = mems[0].espacio_id

  const [eRes, mRes, gRes] = await Promise.all([
    supabase.from('espacios').select('*').eq('id', espId).maybeSingle(),
    supabase.from('espacio_miembros').select('*').eq('espacio_id', espId).order('unido_en'),
    supabase.from('espacio_gastos').select('*').eq('espacio_id', espId).order('creado_en'),
  ])
  if (!eRes.data) return null

  const espacio: Espacio = { id: eRes.data.id, nombre: eRes.data.nombre, codigo: eRes.data.codigo }
  const miembros: EspacioMiembro[] = (mRes.data ?? []).map((m: any) => ({
    userId: m.user_id,
    nombre: m.nombre ?? '',
    ingreso: Number(m.ingreso),
    esYo: m.user_id === u.id,
  }))
  const gastos: EspacioGasto[] = (gRes.data ?? []).map((g: any) => ({
    id: g.id,
    nombre: g.nombre,
    icono: g.icono,
    color: g.color,
    montoMensual: Number(g.monto_mensual),
  }))
  return { espacio, miembros, gastos }
}

export async function crearEspacio(nombre: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { error } = await supabase.rpc('crear_espacio', { p_nombre: nombre })
  if (error) throw error
}

export async function unirseAEspacio(codigo: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { error } = await supabase.rpc('unirse_a_espacio', { p_codigo: codigo })
  if (error) throw error
}

/** Actualiza el nombre/ingreso del miembro actual (solo su propia fila). */
export async function guardarMiMiembro(
  espacioId: string,
  nombre: string,
  ingreso: number,
): Promise<void> {
  const u = usuarioActivo()
  if (!supabase || !u) return
  const { error } = await supabase
    .from('espacio_miembros')
    .update({ nombre, ingreso })
    .eq('espacio_id', espacioId)
    .eq('user_id', u.id)
  if (error) throw error
}

export async function crearGastoEspacio(
  espacioId: string,
  g: Omit<EspacioGasto, 'id'>,
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('espacio_gastos').insert({
    espacio_id: espacioId,
    nombre: g.nombre,
    icono: g.icono,
    color: g.color,
    monto_mensual: g.montoMensual,
  })
  if (error) throw error
}

export async function actualizarGastoEspacio(g: EspacioGasto): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('espacio_gastos')
    .update({ nombre: g.nombre, icono: g.icono, color: g.color, monto_mensual: g.montoMensual })
    .eq('id', g.id)
  if (error) throw error
}

export async function eliminarGastoEspacio(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('espacio_gastos').delete().eq('id', id)
  if (error) throw error
}
