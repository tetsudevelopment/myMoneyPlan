// =====================================================================
//  AppContext — estado central de Mi Plan.
//  Estado + perfil + acciones (movimientos CRUD, deudas CRUD, intereses,
//  auth, perfil, confirmaciones, onboarding). Patrón local-first: escribe
//  en local y pinta al instante; sincroniza con la nube en segundo plano.
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
import { ConfirmDialog, type ConfirmOpts } from '../components/ConfirmDialog'
import { Onboarding } from '../components/Onboarding'
import { hoy, mesActual } from '../lib/fechas'
import { aplicarAbono, aplicarIntereses, deudasVivas } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { nuevoId } from '../lib/id'
import { procesarImagen } from '../lib/imagen'
import { hayNube } from '../lib/supabase'
import {
  actualizarDeudaNube,
  actualizarEmail,
  actualizarMovimientoNube,
  actualizarPassword,
  actualizarSaldoDeudaNube,
  bajarDeNube,
  bajarPerfil,
  borrarAvatarNube,
  cerrarSesion,
  eliminarDeudaNube,
  eliminarMovimientoNube,
  entrar as entrarSupabase,
  guardarPerfilNube,
  insertarDeudaNube,
  insertarMovimientoNube,
  insertarBolsilloNube,
  actualizarBolsilloNube,
  eliminarBolsilloNube,
  insertarPrestamoNube,
  actualizarPrestamoNube,
  eliminarPrestamoNube,
  registrarUsuario,
  restaurarSesion,
  subirAvatarNube,
  subirIntereses,
  usandoNube,
  usuarioActivo,
} from '../lib/sync'
import type { Bolsillo, Deuda, EstadoApp, Movimiento, Perfil, Prestamo, TipoMovimiento } from '../types'
import { cargarLocal, estadoInicial, estaOnboarded, guardarLocal, marcarOnboarded } from './local'
import { cargarPerfil, guardarPerfil, perfilInicial } from './perfil'

export type EstadoNube = 'local' | 'verificando' | 'conectado' | 'error'

export interface NuevoMovimiento {
  tipo: TipoMovimiento
  monto: number
  desc?: string
  cat?: string
  deudaId?: string
}

export interface CambiosMovimiento {
  monto?: number
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
  onboarded: boolean
  // movimientos
  registrarMovimiento: (input: NuevoMovimiento) => void
  editarMovimiento: (id: string | number, cambios: CambiosMovimiento) => void
  eliminarMovimiento: (id: string | number) => Promise<void>
  // deudas
  agregarDeuda: (datos: Omit<Deuda, 'id'>) => void
  editarDeuda: (id: string, cambios: Partial<Omit<Deuda, 'id'>>) => void
  eliminarDeuda: (id: string) => Promise<void>
  aplicarInteresesMes: () => Promise<void>
  // bolsillos (ahorro)
  agregarBolsillo: (nombre: string, saldo: number) => void
  ajustarBolsillo: (id: string, delta: number) => void
  editarBolsillo: (id: string, nombre: string) => void
  eliminarBolsillo: (id: string) => Promise<void>
  // préstamos (dinero prestado)
  agregarPrestamo: (datos: { persona: string; monto: number; fecha: string; nota?: string }) => void
  abonarPrestamo: (id: string, monto: number) => void
  eliminarPrestamo: (id: string) => Promise<void>
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
  // utilidades
  notificar: (mensaje: string) => void
  pedirConfirmacion: (opts: ConfirmOpts) => Promise<boolean>
  completarOnboarding: (datos: { ingresoMensual: number; deudas: Omit<Deuda, 'id'>[] }) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoApp>(() => cargarLocal())
  const [perfil, setPerfil] = useState<Perfil>(() => cargarPerfil())
  const [nube, setNube] = useState<EstadoNube>(() => (hayNube() ? 'verificando' : 'local'))
  const [sesionEmail, setSesionEmail] = useState<string | null>(null)
  const [authAbierto, setAuthAbierto] = useState(false)
  const [onboarded, setOnboarded] = useState<boolean>(() => estaOnboarded())
  const [toast, setToast] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOpts
    resolver: (b: boolean) => void
  } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const estadoRef = useRef(estado)
  estadoRef.current = estado
  const perfilRef = useRef(perfil)
  perfilRef.current = perfil

  const notificar = useCallback((mensaje: string) => {
    setToast(mensaje)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }, [])

  const pedirConfirmacion = useCallback(
    (opts: ConfirmOpts) =>
      new Promise<boolean>((resolver) => setConfirmState({ opts, resolver })),
    [],
  )
  const responderConfirm = useCallback((valor: boolean) => {
    setConfirmState((s) => {
      if (s) s.resolver(valor)
      return null
    })
  }, [])

  // La nube es la fuente de verdad cuando hay sesión: reemplaza SIEMPRE el estado
  // local con lo del usuario (aunque venga vacío), para no mostrar deudas locales
  // o de ejemplo que no le pertenecen.
  const aplicarDatosNube = useCallback((datos: Partial<EstadoApp> | null) => {
    if (!datos) return
    setEstado((prev) => {
      const merged: EstadoApp = {
        ...prev,
        deudas: datos.deudas ?? [],
        movimientos: datos.movimientos ?? [],
        interesesAplicados: datos.interesesAplicados ?? [],
        bolsillos: datos.bolsillos ?? [],
        prestamos: datos.prestamos ?? [],
        ...(datos.config ? { config: datos.config } : {}),
      }
      guardarLocal(merged)
      return merged
    })
    // Si ya tiene deudas en la nube, no mostramos el onboarding.
    if (datos.deudas && datos.deudas.length > 0) {
      marcarOnboarded()
      setOnboarded(true)
    }
  }, [])

  // El perfil de la nube manda: NO heredamos nada del usuario anterior. Una
  // cuenta sin perfil queda vacía (evita fuga de foto/datos entre usuarios).
  const cargarPerfilNube = useCallback(async () => {
    const datos = await bajarPerfil()
    const nuevo: Perfil = datos
      ? { nombre: datos.nombre ?? '', telefono: datos.telefono ?? '', avatar: datos.avatar ?? null }
      : perfilInicial()
    setPerfil(nuevo)
    guardarPerfil(nuevo)
  }, [])

  // --- Arranque ---
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
      const datos = await bajarDeNube()
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

  // --- Movimientos ---

  const registrarMovimiento = useCallback(
    (input: NuevoMovimiento) => {
      const mov: Movimiento = {
        id: nuevoId(),
        fecha: hoy(),
        creadoEn: new Date().toISOString(),
        ...input,
      }
      const prev = estadoRef.current
      let deudas = prev.deudas
      let saldoNuevo: number | null = null
      if (mov.tipo === 'abono' && mov.deudaId) {
        deudas = aplicarAbono(prev.deudas, mov.deudaId, mov.monto)
        saldoNuevo = deudas.find((d) => d.id === mov.deudaId)?.saldo ?? null
      }
      const nuevo: EstadoApp = { ...prev, deudas, movimientos: [...prev.movimientos, mov] }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void insertarMovimientoNube(mov)
      if (mov.tipo === 'abono' && mov.deudaId && saldoNuevo !== null) {
        void actualizarSaldoDeudaNube(mov.deudaId, saldoNuevo)
      }
      notificar(mov.tipo === 'abono' ? 'Abono registrado 💪' : 'Movimiento guardado')
    },
    [notificar],
  )

  const editarMovimiento = useCallback(
    (id: string | number, cambios: CambiosMovimiento) => {
      const prev = estadoRef.current
      const viejo = prev.movimientos.find((m) => m.id === id)
      if (!viejo) return
      const nuevoMov: Movimiento = { ...viejo, ...cambios }
      let deudas = prev.deudas
      const afectadas = new Set<string>()
      if (viejo.tipo === 'abono') {
        deudas = deudas.map((d) => {
          let saldo = d.saldo
          if (d.id === viejo.deudaId) {
            saldo += viejo.monto
            afectadas.add(d.id)
          }
          if (d.id === nuevoMov.deudaId) {
            saldo = Math.max(0, saldo - nuevoMov.monto)
            afectadas.add(d.id)
          }
          return saldo === d.saldo ? d : { ...d, saldo }
        })
      }
      const movimientos = prev.movimientos.map((m) => (m.id === id ? nuevoMov : m))
      const nuevo: EstadoApp = { ...prev, deudas, movimientos }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void actualizarMovimientoNube(nuevoMov)
      afectadas.forEach((did) => {
        const s = deudas.find((d) => d.id === did)?.saldo
        if (s !== undefined) void actualizarSaldoDeudaNube(did, s)
      })
      notificar('Movimiento actualizado')
    },
    [notificar],
  )

  const eliminarMovimiento = useCallback(
    async (id: string | number) => {
      const mov = estadoRef.current.movimientos.find((m) => m.id === id)
      if (!mov) return
      const ok = await pedirConfirmacion({
        titulo: 'Eliminar movimiento',
        mensaje:
          mov.tipo === 'abono'
            ? 'Se eliminará el abono y el saldo de la deuda volverá a subir.'
            : '¿Seguro que quieres eliminar este movimiento?',
        confirmar: 'Eliminar',
        peligroso: true,
      })
      if (!ok) return
      const prev = estadoRef.current
      let deudas = prev.deudas
      let saldoActualizado: { id: string; saldo: number } | null = null
      if (mov.tipo === 'abono' && mov.deudaId) {
        deudas = prev.deudas.map((d) =>
          d.id === mov.deudaId ? { ...d, saldo: d.saldo + mov.monto } : d,
        )
        const s = deudas.find((d) => d.id === mov.deudaId)?.saldo
        if (s !== undefined) saldoActualizado = { id: mov.deudaId, saldo: s }
      }
      const nuevo: EstadoApp = {
        ...prev,
        deudas,
        movimientos: prev.movimientos.filter((m) => m.id !== id),
      }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void eliminarMovimientoNube(String(id))
      if (saldoActualizado) void actualizarSaldoDeudaNube(saldoActualizado.id, saldoActualizado.saldo)
      notificar('Movimiento eliminado')
    },
    [pedirConfirmacion, notificar],
  )

  // --- Deudas ---

  const agregarDeuda = useCallback(
    (datos: Omit<Deuda, 'id'>) => {
      const deuda: Deuda = { id: nuevoId(), ...datos }
      const prev = estadoRef.current
      const nuevo: EstadoApp = { ...prev, deudas: [...prev.deudas, deuda] }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void insertarDeudaNube(deuda)
      notificar('Deuda agregada')
    },
    [notificar],
  )

  const editarDeuda = useCallback(
    (id: string, cambios: Partial<Omit<Deuda, 'id'>>) => {
      const prev = estadoRef.current
      let actualizada: Deuda | undefined
      const deudas = prev.deudas.map((d) => {
        if (d.id !== id) return d
        actualizada = { ...d, ...cambios }
        return actualizada
      })
      const nuevo: EstadoApp = { ...prev, deudas }
      setEstado(nuevo)
      guardarLocal(nuevo)
      if (actualizada) void actualizarDeudaNube(actualizada)
      notificar('Deuda actualizada')
    },
    [notificar],
  )

  const eliminarDeuda = useCallback(
    async (id: string) => {
      const d = estadoRef.current.deudas.find((x) => x.id === id)
      const ok = await pedirConfirmacion({
        titulo: 'Eliminar deuda',
        mensaje: `¿Eliminar "${d?.nombre ?? 'esta deuda'}"? Los movimientos ya registrados no se borran.`,
        confirmar: 'Eliminar',
        peligroso: true,
      })
      if (!ok) return
      const prev = estadoRef.current
      const nuevo: EstadoApp = { ...prev, deudas: prev.deudas.filter((x) => x.id !== id) }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void eliminarDeudaNube(id)
      notificar('Deuda eliminada')
    },
    [pedirConfirmacion, notificar],
  )

  const aplicarInteresesMes = useCallback(async () => {
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
    const ok = await pedirConfirmacion({
      titulo: 'Aplicar intereses del mes',
      mensaje:
        'Se sumarán los intereses a todas tus deudas activas. Solo se puede hacer una vez al mes y no se puede deshacer.',
      confirmar: 'Aplicar intereses',
    })
    if (!ok) return
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
  }, [pedirConfirmacion, notificar])

  // --- Bolsillos (ahorro) ---

  const agregarBolsillo = useCallback(
    (nombre: string, saldo: number) => {
      const b: Bolsillo = { id: nuevoId(), nombre, saldo, creadoEn: new Date().toISOString() }
      const prev = estadoRef.current
      const nuevo: EstadoApp = { ...prev, bolsillos: [...prev.bolsillos, b] }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void insertarBolsilloNube(b)
      notificar('Bolsillo creado')
    },
    [notificar],
  )

  const ajustarBolsillo = useCallback(
    (id: string, delta: number) => {
      const prev = estadoRef.current
      let actualizado: Bolsillo | undefined
      const bolsillos = prev.bolsillos.map((b) => {
        if (b.id !== id) return b
        actualizado = { ...b, saldo: Math.max(0, b.saldo + delta) }
        return actualizado
      })
      const nuevo: EstadoApp = { ...prev, bolsillos }
      setEstado(nuevo)
      guardarLocal(nuevo)
      if (actualizado) void actualizarBolsilloNube(actualizado)
      notificar(delta >= 0 ? 'Aporte registrado 💰' : 'Retiro registrado')
    },
    [notificar],
  )

  const editarBolsillo = useCallback((id: string, nombre: string) => {
    const prev = estadoRef.current
    let actualizado: Bolsillo | undefined
    const bolsillos = prev.bolsillos.map((b) => {
      if (b.id !== id) return b
      actualizado = { ...b, nombre }
      return actualizado
    })
    const nuevo: EstadoApp = { ...prev, bolsillos }
    setEstado(nuevo)
    guardarLocal(nuevo)
    if (actualizado) void actualizarBolsilloNube(actualizado)
  }, [])

  const eliminarBolsillo = useCallback(
    async (id: string) => {
      const b = estadoRef.current.bolsillos.find((x) => x.id === id)
      const ok = await pedirConfirmacion({
        titulo: 'Eliminar bolsillo',
        mensaje: `¿Eliminar "${b?.nombre ?? 'este bolsillo'}"? Se perderá su saldo registrado.`,
        confirmar: 'Eliminar',
        peligroso: true,
      })
      if (!ok) return
      const prev = estadoRef.current
      const nuevo: EstadoApp = { ...prev, bolsillos: prev.bolsillos.filter((x) => x.id !== id) }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void eliminarBolsilloNube(id)
      notificar('Bolsillo eliminado')
    },
    [pedirConfirmacion, notificar],
  )

  // --- Préstamos (dinero prestado) ---

  const agregarPrestamo = useCallback(
    (datos: { persona: string; monto: number; fecha: string; nota?: string }) => {
      const p: Prestamo = {
        id: nuevoId(),
        persona: datos.persona,
        monto: datos.monto,
        abonado: 0,
        fecha: datos.fecha,
        nota: datos.nota,
        creadoEn: new Date().toISOString(),
      }
      const prev = estadoRef.current
      const nuevo: EstadoApp = { ...prev, prestamos: [p, ...prev.prestamos] }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void insertarPrestamoNube(p)
      notificar('Préstamo registrado')
    },
    [notificar],
  )

  const abonarPrestamo = useCallback(
    (id: string, monto: number) => {
      const prev = estadoRef.current
      let actualizado: Prestamo | undefined
      const prestamos = prev.prestamos.map((p) => {
        if (p.id !== id) return p
        actualizado = { ...p, abonado: Math.min(p.monto, p.abonado + monto) }
        return actualizado
      })
      const nuevo: EstadoApp = { ...prev, prestamos }
      setEstado(nuevo)
      guardarLocal(nuevo)
      if (actualizado) void actualizarPrestamoNube(actualizado)
      notificar('Abono registrado 💪')
    },
    [notificar],
  )

  const eliminarPrestamo = useCallback(
    async (id: string) => {
      const p = estadoRef.current.prestamos.find((x) => x.id === id)
      const ok = await pedirConfirmacion({
        titulo: 'Eliminar préstamo',
        mensaje: `¿Eliminar el préstamo a "${p?.persona ?? 'esta persona'}"?`,
        confirmar: 'Eliminar',
        peligroso: true,
      })
      if (!ok) return
      const prev = estadoRef.current
      const nuevo: EstadoApp = { ...prev, prestamos: prev.prestamos.filter((x) => x.id !== id) }
      setEstado(nuevo)
      guardarLocal(nuevo)
      void eliminarPrestamoNube(id)
      notificar('Préstamo eliminado')
    },
    [pedirConfirmacion, notificar],
  )

  // --- Perfil ---

  const actualizarPerfil = useCallback((cambios: { nombre?: string; telefono?: string }) => {
    const nuevo: Perfil = { ...perfilRef.current, ...cambios }
    setPerfil(nuevo)
    guardarPerfil(nuevo)
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
      const datos = await bajarDeNube()
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
    // Limpiar datos del usuario anterior (evita fuga entre cuentas).
    const estadoLimpio = estadoInicial()
    setEstado(estadoLimpio)
    guardarLocal(estadoLimpio)
    const perfilLimpio = perfilInicial()
    setPerfil(perfilLimpio)
    guardarPerfil(perfilLimpio)
    // Tras cerrar sesión, volver a la pantalla de login (si hay nube configurada).
    if (hayNube()) setAuthAbierto(true)
    notificar('Sesión cerrada')
  }, [notificar])

  const abrirAuth = useCallback(() => setAuthAbierto(true), [])
  const cerrarAuth = useCallback(() => setAuthAbierto(false), [])

  // --- Onboarding ---

  const completarOnboarding = useCallback(
    (datos: { ingresoMensual: number; deudas: Omit<Deuda, 'id'>[] }) => {
      const deudas: Deuda[] = datos.deudas.map((d) => ({ id: nuevoId(), ...d }))
      const prev = estadoRef.current
      const nuevo: EstadoApp = {
        ...prev,
        config: { ...prev.config, ingresoMensual: datos.ingresoMensual },
        deudas,
      }
      setEstado(nuevo)
      guardarLocal(nuevo)
      if (usandoNube()) for (const d of deudas) void insertarDeudaNube(d)
      marcarOnboarded()
      setOnboarded(true)
      if (deudas.length > 0) notificar('¡Todo listo! 🎯')
    },
    [notificar],
  )

  const valor = useMemo<AppContextValue>(
    () => ({
      estado,
      perfil,
      nube,
      sesionEmail,
      onboarded,
      registrarMovimiento,
      editarMovimiento,
      eliminarMovimiento,
      agregarDeuda,
      editarDeuda,
      eliminarDeuda,
      aplicarInteresesMes,
      agregarBolsillo,
      ajustarBolsillo,
      editarBolsillo,
      eliminarBolsillo,
      agregarPrestamo,
      abonarPrestamo,
      eliminarPrestamo,
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
      notificar,
      pedirConfirmacion,
      completarOnboarding,
    }),
    [
      estado,
      perfil,
      nube,
      sesionEmail,
      onboarded,
      registrarMovimiento,
      editarMovimiento,
      eliminarMovimiento,
      agregarDeuda,
      editarDeuda,
      eliminarDeuda,
      aplicarInteresesMes,
      agregarBolsillo,
      ajustarBolsillo,
      editarBolsillo,
      eliminarBolsillo,
      agregarPrestamo,
      abonarPrestamo,
      eliminarPrestamo,
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
      notificar,
      pedirConfirmacion,
      completarOnboarding,
    ],
  )

  const mostrarOnboarding = !onboarded && !authAbierto && nube !== 'verificando'

  return (
    <AppContext.Provider value={valor}>
      {children}
      {authAbierto && <AuthScreen />}
      {mostrarOnboarding && <Onboarding />}
      {confirmState && (
        <ConfirmDialog opts={confirmState.opts} onResponder={responderConfirm} />
      )}
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
