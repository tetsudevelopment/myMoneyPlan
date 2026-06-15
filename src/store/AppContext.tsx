// =====================================================================
//  AppContext — estado central de Mi Plan.
//  Mantiene el estado y el perfil, expone las acciones (registrar
//  movimiento, aplicar intereses, login/registro, perfil) y orquesta el
//  patrón local-first: escribe en local y pinta al instante; sincroniza con
//  la nube en segundo plano.
// =====================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AuthScreen } from '../components/AuthScreen'
import { hoy, mesActual } from '../lib/fechas'
import { aplicarAbono, aplicarIntereses, deudasVivas } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { hayNube } from '../lib/supabase'
import { procesarImagen } from '../lib/imagen'
import {
  actualizarEmail,
  actualizarPassword,
  bajarPerfil,
  borrarAvatarNube,
  cerrarSesion,
  entrar as entrarSupabase,
  guardarPerfilNube,
  registrarUsuario,
  restaurarSesion,
  sincronizarBajada,
  subirAvatarNube,
  subirIntereses,
  subirMovimiento,
  usandoNube,
  usuarioActivo,
} from '../lib/sync'
import type { EstadoApp, Movimiento, Perfil, TipoMovimiento } from '../types'
import { cargarLocal, guardarLocal } from './local'
import { cargarPerfil, guardarPerfil } from './perfil'

export type EstadoNube = 'local' | 'verificando' | 'conectado' | 'error'

export interface NuevoMovimiento {
  tipo: TipoMovimiento
  monto: number
  desc?: string
  cat?: string
  deudaId?: string
}

export interface ResultadoRegistro {
  necesitaConfirmar: boolean
}

interface AppContextValue {
  estado: EstadoApp
  perfil: Perfil
  nube: EstadoNube
  sesionEmail: string | null
  registrarMovimiento: (input: NuevoMovimiento) => void
  aplicarInteresesMes: () => void
  notificar: (mensaje: string) => void
  // perfil
  actualizarPerfil: (cambios: { nombre?: string; telefono?: string }) => void
  actualizarAvatar: (file: File) => Promise<void>
  quitarAvatar: () => Promise<void>
  cambiarEmail: (email: string) => Promise<void>
  cambiarPassword: (password: string) => Promise<void>
  // auth
  entrar: (email: string, password: string) => Promise<void>
  registrar: (email: string, password: string) => Promise<ResultadoRegistro>
  salirNube: () => Promise<void>
  abrirAuth: () => void
  cerrarAuth: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoApp>(() => cargarLocal())
  const [perfil, setPerfil] = useState<Perfil>(() => cargarPerfil())
  const [nube, setNube] = useState<EstadoNube>('local')
  const [sesionEmail, setSesionEmail] = useState<string | null>(null)
  const [authAbierto, setAuthAbierto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs frescas para usar dentro de callbacks async sin closures viejos.
  const estadoRef = useRef(estado)
  estadoRef.current = estado
  const perfilRef = useRef(perfil)
  perfilRef.current = perfil

  const notificar = useCallback((mensaje: string) => {
    setToast(mensaje)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }, [])

  const aplicarDatosNube = useCallback((datos: Partial<EstadoApp> | null) => {
    if (datos && datos.deudas && datos.deudas.length > 0) {
      setEstado((prev) => {
        const merged = { ...prev, ...datos } as EstadoApp
        guardarLocal(merged)
        return merged
      })
    }
  }, [])

  // Carga el perfil desde la tabla `perfiles`. Si no existe fila pero hay datos
  // locales, los sube (auto-seed del perfil para la cuenta nueva).
  const cargarPerfilNube = useCallback(async () => {
    const datos = await bajarPerfil()
    if (datos) {
      const fusionado: Perfil = {
        nombre: datos.nombre || perfilRef.current.nombre,
        telefono: datos.telefono || perfilRef.current.telefono,
        avatar: datos.avatar ?? perfilRef.current.avatar,
      }
      setPerfil(fusionado)
      guardarPerfil(fusionado)
    } else {
      const p = perfilRef.current
      if (p.nombre || p.telefono) {
        await guardarPerfilNube({ nombre: p.nombre, telefono: p.telefono }).catch(() => {})
      }
    }
  }, [])

  // --- Arranque: restaura sesión y baja de la nube; si no, pide login ---
  useEffect(() => {
    let cancelado = false
    if (!hayNube()) {
      setNube('local')
      return
    }
    setNube('verificando')
    ;(async () => {
      const ok = await restaurarSesion()
      if (cancelado) return
      if (!ok) {
        setNube('local')
        setAuthAbierto(true)
        return
      }
      setSesionEmail(usuarioActivo()?.email ?? null)
      await cargarPerfilNube()
      const datos = await sincronizarBajada(estadoRef.current.deudas)
      if (cancelado) return
      aplicarDatosNube(datos)
      setNube('conectado')
    })().catch(() => {
      if (!cancelado) {
        setNube('error')
        setAuthAbierto(true)
      }
    })
    return () => {
      cancelado = true
    }
  }, [aplicarDatosNube, cargarPerfilNube])

  // --- Acciones de datos ---

  const registrarMovimiento = useCallback(
    (input: NuevoMovimiento) => {
      const mov: Movimiento = { id: Date.now(), fecha: hoy(), ...input }
      setEstado((prev) => {
        const deudas =
          mov.tipo === 'abono' && mov.deudaId
            ? aplicarAbono(prev.deudas, mov.deudaId, mov.monto)
            : prev.deudas
        const nuevo: EstadoApp = { ...prev, deudas, movimientos: [...prev.movimientos, mov] }
        guardarLocal(nuevo)
        return nuevo
      })
      void subirMovimiento(mov)
      notificar(mov.tipo === 'abono' ? 'Abono registrado 💪' : 'Movimiento guardado')
    },
    [notificar],
  )

  const aplicarInteresesMes = useCallback(() => {
    const estadoActual = estadoRef.current
    const mes = mesActual()
    if (estadoActual.interesesAplicados.includes(mes)) {
      notificar('Ya aplicaste los intereses de este mes ✓')
      return
    }
    if (deudasVivas(estadoActual.deudas).length === 0) {
      notificar('No tienes deudas activas 🎉')
      return
    }
    const { deudas, totalInteres } = aplicarIntereses(estadoActual.deudas)
    const nuevo: EstadoApp = {
      ...estadoActual,
      deudas,
      interesesAplicados: [...estadoActual.interesesAplicados, mes],
    }
    setEstado(nuevo)
    guardarLocal(nuevo)
    void subirIntereses(mes, totalInteres, deudas)
    notificar('Se sumaron ' + fmt(totalInteres) + ' en intereses')
  }, [notificar])

  // --- Perfil ---

  const actualizarPerfil = useCallback((cambios: { nombre?: string; telefono?: string }) => {
    const nuevo: Perfil = { ...perfilRef.current, ...cambios }
    setPerfil(nuevo)
    guardarPerfil(nuevo)
    // nombre/teléfono se respaldan en la tabla `perfiles` si hay sesión
    void guardarPerfilNube({ nombre: nuevo.nombre, telefono: nuevo.telefono }).catch((e) =>
      console.warn('No se pudo respaldar el perfil:', e),
    )
  }, [])

  const actualizarAvatar = useCallback(async (file: File) => {
    const { dataUrl, blob } = await procesarImagen(file, 256)
    if (usandoNube()) {
      const url = await subirAvatarNube(blob)
      const nuevo: Perfil = { ...perfilRef.current, avatar: url }
      setPerfil(nuevo)
      guardarPerfil(nuevo)
      await guardarPerfilNube({ nombre: nuevo.nombre, telefono: nuevo.telefono, avatar_url: url })
    } else {
      const nuevo: Perfil = { ...perfilRef.current, avatar: dataUrl }
      setPerfil(nuevo)
      guardarPerfil(nuevo)
    }
  }, [])

  const quitarAvatar = useCallback(async () => {
    const nuevo: Perfil = { ...perfilRef.current, avatar: null }
    setPerfil(nuevo)
    guardarPerfil(nuevo)
    if (usandoNube()) {
      await borrarAvatarNube().catch(() => {})
      await guardarPerfilNube({
        nombre: nuevo.nombre,
        telefono: nuevo.telefono,
        avatar_url: null,
      }).catch(() => {})
    }
  }, [])

  const cambiarEmail = useCallback(
    async (email: string) => {
      await actualizarEmail(email.trim())
      notificar('Te enviamos un correo para confirmar el nuevo email')
    },
    [notificar],
  )

  const cambiarPassword = useCallback(
    async (password: string) => {
      await actualizarPassword(password)
      notificar('Contraseña actualizada ✓')
    },
    [notificar],
  )

  // --- Auth ---

  const sincronizarTrasLogin = useCallback(
    async (emailFallback: string) => {
      setSesionEmail(usuarioActivo()?.email ?? emailFallback)
      setNube('verificando')
      await cargarPerfilNube()
      const datos = await sincronizarBajada(estadoRef.current.deudas)
      aplicarDatosNube(datos)
      setNube('conectado')
      setAuthAbierto(false)
    },
    [aplicarDatosNube, cargarPerfilNube],
  )

  const entrar = useCallback(
    async (email: string, password: string) => {
      await entrarSupabase(email.trim(), password)
      await sincronizarTrasLogin(email.trim())
      notificar('Sesión iniciada')
    },
    [sincronizarTrasLogin, notificar],
  )

  const registrar = useCallback(
    async (email: string, password: string): Promise<ResultadoRegistro> => {
      const { sesionActiva } = await registrarUsuario(email.trim(), password)
      if (!sesionActiva) {
        notificar('Cuenta creada. Revisa tu correo para confirmarla.')
        return { necesitaConfirmar: true }
      }
      await sincronizarTrasLogin(email.trim())
      notificar('Cuenta creada')
      return { necesitaConfirmar: false }
    },
    [sincronizarTrasLogin, notificar],
  )

  const salirNube = useCallback(async () => {
    await cerrarSesion()
    setSesionEmail(null)
    setNube('local')
    notificar('Sesión cerrada')
  }, [notificar])

  const abrirAuth = useCallback(() => setAuthAbierto(true), [])
  const cerrarAuth = useCallback(() => setAuthAbierto(false), [])

  const valor = useMemo<AppContextValue>(
    () => ({
      estado,
      perfil,
      nube,
      sesionEmail,
      registrarMovimiento,
      aplicarInteresesMes,
      notificar,
      actualizarPerfil,
      actualizarAvatar,
      quitarAvatar,
      cambiarEmail,
      cambiarPassword,
      entrar,
      registrar,
      salirNube,
      abrirAuth,
      cerrarAuth,
    }),
    [
      estado,
      perfil,
      nube,
      sesionEmail,
      registrarMovimiento,
      aplicarInteresesMes,
      notificar,
      actualizarPerfil,
      actualizarAvatar,
      quitarAvatar,
      cambiarEmail,
      cambiarPassword,
      entrar,
      registrar,
      salirNube,
      abrirAuth,
      cerrarAuth,
    ],
  )

  return (
    <AppContext.Provider value={valor}>
      {children}
      {authAbierto && <AuthScreen />}
      {toast && (
        <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] left-1/2 z-[200] -translate-x-1/2 whitespace-nowrap rounded-xl bg-verde-prof px-5 py-3 text-[13px] font-medium text-crema shadow-suave-lg">
          {toast}
        </div>
      )}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
