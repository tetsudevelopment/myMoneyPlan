import { useState } from 'react'
import { useApp } from '../store/AppContext'

type Modo = 'entrar' | 'registrar'

const VALOR = [
  { ico: '❄️', txt: 'Estrategia bola de nieve para salir de deudas más rápido' },
  { ico: '📶', txt: 'Funciona sin conexión y se sincroniza sola' },
  { ico: '🔒', txt: 'Tus datos son privados y solo tuyos' },
]

/**
 * Pantalla de autenticación (email + contraseña) con dos modos: iniciar
 * sesión y crear cuenta. Responsive: tarjeta en móvil, split-screen en
 * tablet/desktop. Permite continuar sin cuenta (modo solo-local).
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
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-crema">
      <div className="flex min-h-full flex-col lg:grid lg:grid-cols-[1.1fr_1fr]">
        {/* ---------- Panel de marca ---------- */}
        <aside className="relative isolate overflow-hidden bg-gradient-to-br from-verde-prof via-verde-prof to-verde-medio px-6 pb-12 pt-[calc(env(safe-area-inset-top)+44px)] text-crema lg:flex lg:flex-col lg:justify-between lg:px-14 lg:pb-14 lg:pt-16">
          <div className="pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-verde-vivo/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 -z-10 h-72 w-72 rounded-full bg-verde-vivo/10 blur-3xl" />

          <div>
            <div className="mb-1 inline-flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-verde-vivo/25 text-xl">
                💚
              </span>
              <span className="text-sm font-medium opacity-75">Mi Plan</span>
            </div>
            <h1 className="mt-6 text-[28px] font-bold leading-tight tracking-tight lg:text-[40px]">
              Toma el control
              <br />
              de tus deudas.
            </h1>
            <p className="mt-3 max-w-sm text-sm opacity-70 lg:text-base">
              Organiza, abona y mira cómo te acercas a cero — un mes a la vez.
            </p>
          </div>

          {/* Propuesta de valor: solo en pantallas grandes */}
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

        {/* ---------- Panel del formulario ---------- */}
        <main className="-mt-6 flex flex-1 items-start justify-center px-5 pb-10 lg:mt-0 lg:items-center lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="rounded-3xl bg-white p-6 shadow-suave-lg sm:p-8">
              <h2 className="text-xl font-bold tracking-tight">
                {modo === 'entrar' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
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
                className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-crema p-1"
              >
                {(['entrar', 'registrar'] as Modo[]).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={modo === m}
                    onClick={() => cambiarModo(m)}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                      modo === m ? 'bg-verde-prof text-crema shadow-suave' : 'text-gris'
                    }`}
                  >
                    {m === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </button>
                ))}
              </div>

              {/* Campos */}
              <div className="mt-5 space-y-4">
                <Campo label="Correo" htmlFor="auth-email">
                  <input
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && enviar()}
                    className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none transition focus:border-verde-vivo focus:ring-4 focus:ring-verde-vivo/15"
                  />
                </Campo>

                <Campo label="Contraseña" htmlFor="auth-pass">
                  <div className="relative">
                    <input
                      id="auth-pass"
                      type={verPass ? 'text' : 'password'}
                      autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && enviar()}
                      className="w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 pr-12 text-base outline-none transition focus:border-verde-vivo focus:ring-4 focus:ring-verde-vivo/15"
                    />
                    <button
                      type="button"
                      onClick={() => setVerPass((v) => !v)}
                      aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute inset-y-0 right-0 grid w-12 place-items-center text-lg text-gris-claro"
                    >
                      {verPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </Campo>
              </div>

              {/* Mensajes */}
              {error && (
                <p className="mt-4 rounded-lg bg-rojo-bg px-3 py-2 text-[12.5px] font-medium text-rojo">
                  {error}
                </p>
              )}
              {info && (
                <p className="mt-4 rounded-lg bg-verde-claro px-3 py-2 text-[12.5px] font-medium text-verde-medio">
                  {info}
                </p>
              )}

              {/* Acción principal */}
              <button
                onClick={enviar}
                disabled={cargando}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition hover:bg-verde-medio active:scale-[.99] disabled:opacity-60"
              >
                {cargando && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-crema/40 border-t-crema" />
                )}
                {cargando
                  ? 'Un momento…'
                  : modo === 'entrar'
                    ? 'Entrar'
                    : 'Crear mi cuenta'}
              </button>

              {/* Cambio de modo en texto */}
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
              className="mx-auto mt-5 block py-2 text-center text-[13px] font-medium text-gris underline-offset-2 hover:underline"
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
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-gris">
        {label}
      </label>
      {children}
    </div>
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
