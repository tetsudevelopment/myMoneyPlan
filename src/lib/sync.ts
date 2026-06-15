// =====================================================================
//  Capa de sincronización con Supabase (nube, opcional).
//  Patrón: local-first. Estas funciones solo actúan si hay sesión activa.
//  Auth = email/OTP (código de 6 dígitos). Ver ARCHITECTURE.md §3-4.
// =====================================================================

import type { User } from '@supabase/supabase-js'
import type { Deuda, EstadoApp, Movimiento } from '../types'
import { supabase } from './supabase'

let usuario: User | null = null

export const usuarioActivo = (): User | null => usuario
export const usandoNube = (): boolean => supabase !== null && usuario !== null

// ---------- Sesión / auth ----------

/** Restaura la sesión guardada (si existe). Devuelve true si hay sesión. */
export async function restaurarSesion(): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    usuario = data.session.user
    return true
  }
  return false
}

/** Inicia sesión con email + contraseña. */
export async function entrar(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  usuario = data.user
}

export interface ResultadoRegistro {
  /** true si quedó con sesión activa; false si Supabase pide confirmar el correo. */
  sesionActiva: boolean
}

/** Crea una cuenta nueva con email + contraseña. */
export async function registrarUsuario(
  email: string,
  password: string,
): Promise<ResultadoRegistro> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  if (data.session) {
    usuario = data.user
    return { sesionActiva: true }
  }
  // Sin sesión => el proyecto exige confirmar el correo antes de entrar.
  return { sesionActiva: false }
}

/** Cierra la sesión de nube. */
export async function cerrarSesion(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
  usuario = null
}

// ---------- Perfil del usuario (tabla public.perfiles + Storage) ----------

const BUCKET_AVATARS = 'avatars'

export interface PerfilNube {
  nombre: string
  telefono: string
  avatar: string | null
}

/** Baja el perfil del usuario desde la tabla `perfiles`. Null si no existe. */
export async function bajarPerfil(): Promise<PerfilNube | null> {
  if (!supabase || !usuario) return null
  const { data, error } = await supabase
    .from('perfiles')
    .select('nombre, telefono, avatar_url')
    .eq('user_id', usuario.id)
    .maybeSingle()
  if (error) {
    console.warn('Error bajando perfil:', error.message)
    return null
  }
  if (!data) return null
  return {
    nombre: data.nombre ?? '',
    telefono: data.telefono ?? '',
    avatar: data.avatar_url ?? null,
  }
}

/** Crea/actualiza el perfil en la tabla `perfiles` (upsert por user_id). */
export async function guardarPerfilNube(datos: {
  nombre: string
  telefono: string
  avatar_url?: string | null
}): Promise<void> {
  if (!supabase || !usuario) return
  const fila: Record<string, unknown> = {
    user_id: usuario.id,
    nombre: datos.nombre,
    telefono: datos.telefono,
  }
  // Solo toca avatar_url si se pasa explícitamente (evita borrarlo al guardar datos).
  if (datos.avatar_url !== undefined) fila.avatar_url = datos.avatar_url
  const { error } = await supabase.from('perfiles').upsert(fila, { onConflict: 'user_id' })
  if (error) throw error
}

/** Sube el avatar al bucket `avatars` y devuelve su URL pública (con cache-busting). */
export async function subirAvatarNube(blob: Blob): Promise<string> {
  if (!supabase || !usuario) throw new Error('Sin sesión')
  const ruta = `${usuario.id}/avatar.jpg`
  const { error } = await supabase.storage
    .from(BUCKET_AVATARS)
    .upload(ruta, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(ruta)
  return `${data.publicUrl}?v=${Date.now()}`
}

/** Borra el avatar del bucket. */
export async function borrarAvatarNube(): Promise<void> {
  if (!supabase || !usuario) return
  await supabase.storage.from(BUCKET_AVATARS).remove([`${usuario.id}/avatar.jpg`])
}

/** Cambia el correo (Supabase envía un correo de confirmación al nuevo). */
export async function actualizarEmail(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { error } = await supabase.auth.updateUser({ email })
  if (error) throw error
}

/** Cambia la contraseña del usuario en sesión. */
export async function actualizarPassword(password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

// ---------- Mapeo nube (snake_case) -> modelo (camelCase) ----------

/* eslint-disable @typescript-eslint/no-explicit-any */
const aModeloDeuda = (d: any): Deuda => ({
  id: d.id,
  nombre: d.nombre,
  tipo: d.tipo,
  saldoInicial: Number(d.saldo_inicial),
  saldo: Number(d.saldo_actual),
  cuota: Number(d.cuota_mensual),
  tasaEA: Number(d.tasa_ea),
  orden: d.orden_ataque,
})

const aModeloMov = (m: any): Movimiento => ({
  id: m.id,
  tipo: m.tipo,
  monto: Number(m.monto),
  desc: m.descripcion ?? '',
  cat: m.categoria ?? undefined,
  deudaId: m.deuda_id ?? undefined,
  fecha: m.fecha,
})

// ---------- Bajar / subir ----------

/** Baja todo el estado del usuario desde la nube. Null si falla o no hay sesión. */
export async function bajarDeNube(): Promise<Partial<EstadoApp> | null> {
  if (!supabase || !usuario) return null
  const uid = usuario.id
  try {
    const [dRes, mRes, iRes, cRes] = await Promise.all([
      supabase.from('deudas').select('*').eq('user_id', uid).order('orden_ataque'),
      supabase.from('movimientos').select('*').eq('user_id', uid).order('fecha', { ascending: false }),
      supabase.from('intereses_aplicados').select('mes').eq('user_id', uid),
      supabase.from('config').select('*').eq('user_id', uid).maybeSingle(),
    ])
    if (dRes.error || mRes.error || iRes.error) return null
    const parcial: Partial<EstadoApp> = {
      deudas: (dRes.data ?? []).map(aModeloDeuda),
      movimientos: (mRes.data ?? []).map(aModeloMov),
      interesesAplicados: (iRes.data ?? []).map((x: any) => x.mes),
    }
    if (cRes.data) {
      parcial.config = {
        ingresoMensual: Number(cRes.data.ingreso_mensual),
        presupuestoOcio: Number(cRes.data.presupuesto_ocio),
      }
    }
    return parcial
  } catch (e) {
    console.warn('Error bajando de la nube:', e)
    return null
  }
}

/** Siembra en la nube las deudas dadas (primer arranque de una cuenta vacía). */
export async function subirDeudasIniciales(deudas: Deuda[]): Promise<void> {
  if (!supabase || !usuario) return
  const filas = deudas.map((d) => ({
    user_id: usuario!.id,
    nombre: d.nombre,
    tipo: d.tipo,
    saldo_inicial: d.saldoInicial,
    saldo_actual: d.saldo,
    cuota_mensual: d.cuota,
    tasa_ea: d.tasaEA,
    orden_ataque: d.orden,
  }))
  await supabase.from('deudas').insert(filas)
}

/**
 * Baja el estado de la nube. Si la cuenta no tiene deudas todavía, las siembra
 * con `localDeudas` y vuelve a bajar (así cada cuenta nueva queda lista).
 */
export async function sincronizarBajada(
  localDeudas: Deuda[],
): Promise<Partial<EstadoApp> | null> {
  let datos = await bajarDeNube()
  if (datos && (!datos.deudas || datos.deudas.length === 0)) {
    await subirDeudasIniciales(localDeudas)
    datos = await bajarDeNube()
  }
  return datos
}

// ---------- Movimientos (CRUD en la nube) ----------
// Se insertan con el id del cliente (uuid) para que local y nube coincidan,
// lo que permite editar y borrar de forma fiable.

const filaMov = (mov: Movimiento) => ({
  id: String(mov.id),
  tipo: mov.tipo,
  monto: mov.monto,
  descripcion: mov.desc ?? null,
  categoria: mov.cat ?? null,
  deuda_id: mov.deudaId ?? null,
  fecha: mov.fecha,
})

/** Inserta un movimiento nuevo en la nube. */
export async function insertarMovimientoNube(mov: Movimiento): Promise<void> {
  if (!supabase || !usuario) return
  try {
    await supabase.from('movimientos').insert({ user_id: usuario.id, ...filaMov(mov) })
  } catch (e) {
    console.warn('Error insertando movimiento:', e)
  }
}

/** Actualiza un movimiento existente. */
export async function actualizarMovimientoNube(mov: Movimiento): Promise<void> {
  if (!supabase || !usuario) return
  try {
    await supabase
      .from('movimientos')
      .update({
        monto: mov.monto,
        descripcion: mov.desc ?? null,
        categoria: mov.cat ?? null,
        deuda_id: mov.deudaId ?? null,
      })
      .eq('id', String(mov.id))
  } catch (e) {
    console.warn('Error actualizando movimiento:', e)
  }
}

/** Borra un movimiento por id. */
export async function eliminarMovimientoNube(id: string): Promise<void> {
  if (!supabase || !usuario) return
  try {
    await supabase.from('movimientos').delete().eq('id', id)
  } catch (e) {
    console.warn('Error eliminando movimiento:', e)
  }
}

/** Actualiza el saldo (y estado activa) de una deuda. */
export async function actualizarSaldoDeudaNube(deudaId: string, saldo: number): Promise<void> {
  if (!supabase || !usuario) return
  try {
    await supabase
      .from('deudas')
      .update({ saldo_actual: saldo, activa: saldo > 1 })
      .eq('id', deudaId)
  } catch (e) {
    console.warn('Error actualizando saldo de deuda:', e)
  }
}

// ---------- Deudas (CRUD en la nube) ----------

const filaDeuda = (d: Deuda) => ({
  id: d.id,
  nombre: d.nombre,
  tipo: d.tipo,
  saldo_inicial: d.saldoInicial,
  saldo_actual: d.saldo,
  cuota_mensual: d.cuota,
  tasa_ea: d.tasaEA,
  orden_ataque: d.orden,
  activa: d.saldo > 1,
})

/** Inserta una deuda nueva (con el id del cliente). */
export async function insertarDeudaNube(deuda: Deuda): Promise<void> {
  if (!supabase || !usuario) return
  try {
    await supabase.from('deudas').insert({ user_id: usuario.id, ...filaDeuda(deuda) })
  } catch (e) {
    console.warn('Error insertando deuda:', e)
  }
}

/** Actualiza todos los campos de una deuda. */
export async function actualizarDeudaNube(deuda: Deuda): Promise<void> {
  if (!supabase || !usuario) return
  try {
    const { id: _id, ...campos } = filaDeuda(deuda)
    void _id
    await supabase.from('deudas').update(campos).eq('id', deuda.id)
  } catch (e) {
    console.warn('Error actualizando deuda:', e)
  }
}

/** Borra una deuda por id. */
export async function eliminarDeudaNube(id: string): Promise<void> {
  if (!supabase || !usuario) return
  try {
    await supabase.from('deudas').delete().eq('id', id)
  } catch (e) {
    console.warn('Error eliminando deuda:', e)
  }
}

/** Registra el mes de intereses y actualiza los saldos en la nube. */
export async function subirIntereses(
  mes: string,
  total: number,
  deudas: Deuda[],
): Promise<void> {
  if (!supabase || !usuario) return
  try {
    await supabase
      .from('intereses_aplicados')
      .insert({ user_id: usuario.id, mes, total_interes: total })
    for (const d of deudas) {
      if (d.saldo > 0) {
        await supabase.from('deudas').update({ saldo_actual: d.saldo }).eq('id', d.id)
      }
    }
  } catch (e) {
    console.warn('Error subiendo intereses:', e)
  }
}
