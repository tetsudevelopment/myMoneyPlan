// Persistencia local del perfil del usuario (nombre, teléfono, avatar).

import type { Perfil } from '../types'

const KEY = 'miplan_perfil'

export const perfilInicial = (): Perfil => ({ nombre: '', telefono: '', avatar: null })

export function cargarPerfil(): Perfil {
  try {
    const crudo = localStorage.getItem(KEY)
    if (crudo) {
      const p = JSON.parse(crudo) as Partial<Perfil>
      return { ...perfilInicial(), ...p }
    }
  } catch {
    /* ignora datos corruptos */
  }
  return perfilInicial()
}

export function guardarPerfil(perfil: Perfil): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(perfil))
  } catch {
    /* almacenamiento no disponible */
  }
}
