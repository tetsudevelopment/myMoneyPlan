import { useState, type ReactNode } from 'react'
import { useApp } from '../store/AppContext'

type Modo = 'entrar' | 'registrar'

const VALOR = [
  { ico: '❄️', txt: 'Estrategia bola de nieve para salir de deudas más rápido' },
  { ico: '📶', txt: 'Funciona sin conexión y se sincroniza sola' },
  { ico: '🔒', txt: 'Tus datos son privados y solo tuyos' },
]

/**
 * Pantalla de autenticación (email + contraseña). Móvil: marca arriba en
 * degradado que fluye hacia una hoja blanca redondeada. Desktop: split-screen.
 */
export function AuthScreen() {
  const { entrar, registrar, cerrarAuth, notificar } = useApp()
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const validar = (): string | null => {
    if (!email.includes('@')) return 'Escribe un correo válido.'
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return null
  }

  const enviar = async () => {
    setError(null)
    setInfo(null)
    const fallo = validar()
    if (fallo) return setError(fallo)
    setCargando(true)
    try {
      if (modo === 'entrar') {
        await entrar(email, password)
      } else {
        const { necesitaConfirmar } = await registrar(email, password)
        if (necesitaConfirmar) {
          setInfo('Cuenta creada ✓ Revisa tu correo para confirmarla y luego inicia sesión.')
          setModo('entrar')
          setPassword('')
        }
      }
    } catch (e) {
      setError(traducirError(e))
    } finally {
      setCargando(false)
    }
  }

  const cambiarModo = (m: Modo) => {
    setModo(m)
    setError(null)
    setInfo(null)
  }

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-verde-prof lg:bg-crema">
      <div className="flex min-h-full flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- Marca ---------- */}
        <aside className="relative isolate overflow-hidden bg-gradient-to-br from-verde-prof via-verde-prof to-verde-medio px-7 pb-16 pt-[calc(env(safe-area-inset-top)+52px)] text-crema lg:flex lg:flex-col lg:justify-between lg:px-14 lg:pb-14 lg:pt-16">
          <div className="pointer-events-none absolute -right-20 -top-16 -z-10 h-64 w-64 rounded-full bg-verde-vivo/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 -z-10 h-72 w-72 rounded-full bg-verde-vivo/10 blur-3xl" />

          <div>
            <div className="inline-flex items-center gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-xl backdrop-blur">
                💚
              </span>
              <span className="text-[15px] font-semibold tracking-wide opacity-90">Mi Plan</span>
            </div>
            <h1 className="mt-8 text-[30px] font-bold leading-[1.15] tracking-tight lg:text-[42px]">
              Toma el control
              <br />
              de tus deudas.
            </h1>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed opacity-70 lg:text-base">
              Organiza, abona y mira cómo te acercas a cero — un mes a la vez.
            </p>
          </div>

          <ul className="mt-10 hidden space-y-4 lg:block">
            {VALOR.map((v) => (
              <li key={v.txt} className="flex items-start gap-3 text-[15px] opacity-90">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-white/10 text-base">
                  {v.ico}
                </span>
                <span className="pt-1">{v.txt}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* ---------- Formulario ---------- */}
        <main className="relative z-10 -mt-7 flex-1 rounded-t-[34px] bg-crema px-6 pb-10 pt-8 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:px-12">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="lg:rounded-3xl lg:bg-white lg:p-7 lg:shadow-suave-lg">
              <h2 className="text-[22px] font-bold tracking-tight">
                {modo === 'entrar' ? 'Bienvenido de nuevo 👋' : 'Crea tu cuenta'}
              </h2>
              <p className="mt-1 text-[13px] text-gris">
                {modo === 'entrar'
                  ? 'Entra para sincronizar tus deudas.'
                  : 'Empieza tu plan para salir de deudas.'}
              </p>

              {/* Segmented control */}
              <div
                role="tablist"
                aria-label="Modo de acceso"
                className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-suave lg:bg-crema lg:shadow-none"
              >
                {(['entrar', 'registrar'] as Modo[]).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={modo === m}
                    onClick={() => cambiarModo(m)}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                      modo === m ? 'bg-verde-prof text-crema shadow-suave' : 'text-gris'
                    }`}
                  >
                    {m === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </button>
                ))}
              </div>

              {/* Campos */}
              <div className="mt-5 space-y-3.5">
                <Campo label="Correo" htmlFor="auth-email" icono={<IconMail />}>
                  <input
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && enviar()}
                    className="w-full rounded-2xl border-[1.5px] border-linea bg-white py-3.5 pl-11 pr-3.5 text-base outline-none transition focus:border-verde-vivo focus:ring-4 focus:ring-verde-vivo/15"
                  />
                </Campo>

                <Campo label="Contraseña" htmlFor="auth-pass" icono={<IconLock />}>
                  <input
                    id="auth-pass"
                    type={verPass ? 'text' : 'password'}
                    autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && enviar()}
                    className="w-full rounded-2xl border-[1.5px] border-linea bg-white py-3.5 pl-11 pr-12 text-base outline-none transition focus:border-verde-vivo focus:ring-4 focus:ring-verde-vivo/15"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPass((v) => !v)}
                    aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gris-claro transition hover:text-gris"
                  >
                    {verPass ? <IconEyeOff /> : <IconEye />}
                  </button>
                </Campo>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-rojo-bg px-3.5 py-2.5 text-[12.5px] font-medium text-rojo">
                  {error}
                </p>
              )}
              {info && (
                <p className="mt-4 rounded-xl bg-verde-claro px-3.5 py-2.5 text-[12.5px] font-medium text-verde-medio">
                  {info}
                </p>
              )}

              <button
                onClick={enviar}
                disabled={cargando}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-verde-prof py-4 text-[15px] font-semibold text-crema shadow-suave transition hover:bg-verde-medio active:scale-[.99] disabled:opacity-60"
              >
                {cargando && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-crema/40 border-t-crema" />
                )}
                {cargando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear mi cuenta'}
              </button>

              <p className="mt-4 text-center text-[13px] text-gris">
                {modo === 'entrar' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <button
                  onClick={() => cambiarModo(modo === 'entrar' ? 'registrar' : 'entrar')}
                  className="font-semibold text-verde-medio hover:underline"
                >
                  {modo === 'entrar' ? 'Crear una' : 'Iniciar sesión'}
                </button>
              </p>
            </div>

            <button
              onClick={() => {
                cerrarAuth()
                notificar('Modo solo-local: tus datos quedan en este dispositivo')
              }}
              className="mx-auto mt-6 block py-2 text-center text-[13px] font-medium text-gris underline-offset-2 hover:underline"
            >
              Usar sin cuenta (solo este dispositivo)
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

function Campo({
  label,
  htmlFor,
  icono,
  children,
}: {
  label: string
  htmlFor: string
  icono: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-gris">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-gris-claro">
          {icono}
        </span>
        {children}
      </div>
    </div>
  )
}

// --- Íconos (line icons) ---

function IconMail() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a13.4 13.4 0 0 1-2.4 3.1M6.2 6.2A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9.3 9.3 0 0 0 4-.9" />
      <path d="m3 3 18 18" />
    </svg>
  )
}

function traducirError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed'))
    return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Ese correo ya tiene cuenta. Inicia sesión.'
  if (m.includes('password')) return 'La contraseña no cumple los requisitos (mínimo 6).'
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento.'
  return 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.'
}
