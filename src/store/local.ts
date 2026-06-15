// =====================================================================
//  Persistencia local (offline) — fuente de verdad primaria.
//  Guarda el estado completo en localStorage.
// =====================================================================

import { CONFIG_DEFAULT, DEUDAS_INIT } from '../lib/constantes'
import type { EstadoApp } from '../types'

const KEY = 'miplan_v1'

/** Estado por defecto al primer arranque (modo solo-local). */
export function estadoInicial(): EstadoApp {
  return {
    deudas: structuredClone(DEUDAS_INIT),
    movimientos: [],
    interesesAplicados: [],
    config: { ...CONFIG_DEFAULT },
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
