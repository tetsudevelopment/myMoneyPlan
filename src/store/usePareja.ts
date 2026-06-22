import { useCallback, useEffect, useState } from 'react'
import {
  actualizarGastoEspacio,
  cargarEspacio,
  crearEspacio,
  crearGastoEspacio,
  eliminarGastoEspacio,
  guardarMiMiembro,
  unirseAEspacio,
  type DatosEspacio,
} from '../lib/pareja'
import type { EspacioGasto } from '../types'
import { useApp } from './AppContext'

/**
 * Estado y acciones del plan en pareja. Es solo-nube: depende de la sesión.
 * Se recarga cuando cambia la sesión.
 */
export function usePareja() {
  const { sesionEmail, notificar } = useApp()
  const [datos, setDatos] = useState<DatosEspacio | null>(null)
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      setDatos(await cargarEspacio())
    } catch {
      setDatos(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!sesionEmail) {
      setDatos(null)
      setCargando(false)
      return
    }
    void recargar()
  }, [sesionEmail, recargar])

  const crear = useCallback(
    async (nombre: string) => {
      await crearEspacio(nombre)
      await recargar()
      notificar('Espacio en pareja creado 💑')
    },
    [recargar, notificar],
  )

  const unirse = useCallback(
    async (codigo: string) => {
      await unirseAEspacio(codigo)
      await recargar()
      notificar('Te uniste al espacio 💑')
    },
    [recargar, notificar],
  )

  const guardarIngreso = useCallback(
    async (nombre: string, ingreso: number) => {
      if (!datos) return
      await guardarMiMiembro(datos.espacio.id, nombre, ingreso)
      await recargar()
      notificar('Datos guardados')
    },
    [datos, recargar, notificar],
  )

  const agregarGasto = useCallback(
    async (g: Omit<EspacioGasto, 'id'>) => {
      if (!datos) return
      await crearGastoEspacio(datos.espacio.id, g)
      await recargar()
    },
    [datos, recargar],
  )

  const editarGasto = useCallback(
    async (g: EspacioGasto) => {
      await actualizarGastoEspacio(g)
      await recargar()
    },
    [recargar],
  )

  const borrarGasto = useCallback(
    async (id: string) => {
      await eliminarGastoEspacio(id)
      await recargar()
    },
    [recargar],
  )

  return {
    cargando,
    espacio: datos?.espacio ?? null,
    miembros: datos?.miembros ?? [],
    gastos: datos?.gastos ?? [],
    sinSesion: !sesionEmail,
    recargar,
    crear,
    unirse,
    guardarIngreso,
    agregarGasto,
    editarGasto,
    borrarGasto,
  }
}
