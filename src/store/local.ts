// =====================================================================
//  Persistencia local (offline) — fuente de verdad primaria.
//  Guarda el estado completo en localStorage.
// =====================================================================

import { CONFIG_DEFAULT } from '../lib/constantes'
import type { EstadoApp } from '../types'

const KEY = 'miplan_v1'
const KEY_ONBOARDED = 'miplan_onboarded'

/** Estado por defecto al primer arranque: vacío (el onboarding lo llena). */
export function estadoInicial(): EstadoApp {
  return {
    deudas: [],
    movimientos: [],
    interesesAplicados: [],
    config: { ...CONFIG_DEFAULT },
    bolsillos: [],
    prestamos: [],
  }
}

/** Carga el estado de localStorage; si no hay o está corrupto, usa el inicial. */
export function cargarLocal(): EstadoApp {
  try {
    const crudo = localStorage.getItem(KEY)
    if (crudo) {
      const s = JSON.parse(crudo) as Partial<EstadoApp>
      if (s && Array.isArray(s.deudas)) {
        return { ...estadoInicial(), ...s } as EstadoApp
      }
    }
  } catch {
    /* ignora JSON corrupto y cae al inicial */
  }
  return estadoInicial()
}

/** Guarda el estado completo en localStorage. */
export function guardarLocal(estado: EstadoApp): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(estado))
  } catch {
    /* almacenamiento lleno o no disponible: la app sigue en memoria */
  }
}

// ---------- Onboarding ----------

/** true si el usuario ya pasó por la configuración inicial. */
export function estaOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY_ONBOARDED) === '1'
  } catch {
    return false
  }
}

export function marcarOnboarded(): void {
  try {
    localStorage.setItem(KEY_ONBOARDED, '1')
  } catch {
    /* ignora */
  }
}
