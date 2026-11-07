import { useRef, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { hayNube } from '../lib/supabase'
import { useApp } from '../store/AppContext'

export function Perfil({ onAbrirPareja }: { onAbrirPareja: () => void }) {
  const {
    perfil,
    sesionEmail,
    actualizarPerfil,
    actualizarAvatar,
    quitarAvatar,
    cambiarEmail,
    cambiarPassword,
    salirNube,
    abrirAuth,
    notificar,
  } = useApp()

  const fileRef = useRef<HTMLInputElement>(null)

  // Datos personales
  const [nombre, setNombre] = useState(perfil.nombre)
  const [telefono, setTelefono] = useState(perfil.telefono)
  const [email, setEmail] = useState(sesionEmail ?? '')
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  // Contraseña
  const [pass1, setPass1] = useState('')
  const [pass2, setPass2] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)

  const subirAvatar = async (file: File) => {
    setSubiendoFoto(true)
    try {
      await actualizarAvatar(file)
      notificar('Foto de perfil actualizada')
    } catch {
      notificar('No se pudo subir la imagen')
    } finally {
      setSubiendoFoto(false)
    }
  }

  const guardarDatos = async () => {
    setGuardando(true)
    try {
      actualizarPerfil({ nombre: nombre.trim(), telefono: telefono.trim() })
      // Cambio de correo (solo con sesión y si cambió)
      if (sesionEmail && email.trim() && email.trim() !== sesionEmail) {
        if (!email.includes('@')) {
          notificar('Escribe un correo válido')
          return
        }
        await cambiarEmail(email)
      } else {
        notificar('Datos guardados ✓')
      }
    } catch {
      notificar('No se pudo actualizar el correo')
    } finally {
      setGuardando(false)
    }
  }

  const actualizarClave = async () => {
    if (pass1.length < 6) return notificar('La contraseña debe tener al menos 6 caracteres')
    if (pass1 !== pass2) return notificar('Las contraseñas no coinciden')
    setCambiandoPass(true)
    try {
      await cambiarPassword(pass1)
      setPass1('')
      setPass2('')
    } catch {
      notificar('No se pudo cambiar la contraseña')
    } finally {
      setCambiandoPass(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Cabecera con avatar */}
      <section className="card flex flex-col items-center p-6 text-center">
        <div className="relative">
          <Avatar
            src={perfil.avatar}
            nombre={perfil.nombre}
            email={sesionEmail}
            className="h-24 w-24 rounded-full text-3xl"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={subiendoFoto}
            aria-label="Cambiar foto"
            className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-verde-vivo text-base text-white shadow-suave disabled:opacity-70"
          >
            {subiendoFoto ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              '📷'
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void subirAvatar(f)
              e.target.value = ''
            }}
          />
        </div>
        <div className="mt-3 text-lg font-bold">{perfil.nombre || 'Tu nombre'}</div>
        {sesionEmail ? (
          <div className="text-[13px] text-gris">{sesionEmail}</div>
        ) : (
          <div className="text-[13px] text-gris-claro">Sin cuenta · modo solo-local</div>
        )}
        {perfil.avatar && (
          <button
            onClick={async () => {
              await quitarAvatar()
              notificar('Foto eliminada')
            }}
            className="mt-2 text-[12px] font-medium text-rojo"
          >
            Quitar foto
          </button>
        )}
      </section>

      {/* Acceso al plan en pareja (en desktop está en el menú lateral) */}
      <button
        onClick={onAbrirPareja}
        className="card flex w-full items-center gap-3 text-left transition active:scale-[.99] lg:hidden"
      >
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-verde-claro text-xl">
          💑
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold">Plan en pareja</span>
          <span className="block text-[12px] text-gris">Gastos compartidos y reparto por ingreso</span>
        </span>
        <span className="text-gris-claro">›</span>
      </button>

      {/* Datos personales */}
      <section className="card p-5">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-gris">
          Datos personales
        </h2>
        <div className="space-y-4">
          <Campo label="Nombre">
            <Input value={nombre} onChange={setNombre} placeholder="Tu nombre" />
          </Campo>
          <Campo label="Teléfono">
            <Input
              value={telefono}
              onChange={setTelefono}
              placeholder="3001234567"
              type="tel"
              inputMode="tel"
            />
          </Campo>
          <Campo label="Correo">
            <Input
              value={email}
              onChange={setEmail}
              placeholder="tucorreo@ejemplo.com"
              type="email"
              inputMode="email"
              disabled={!sesionEmail}
            />
            {!sesionEmail && (
              <p className="mt-1.5 text-[12px] text-gris">
                Inicia sesión para usar y cambiar tu correo.
              </p>
            )}
            {sesionEmail && (
              <p className="mt-1.5 text-[12px] text-gris">
                Al cambiarlo te enviaremos un correo de confirmación.
              </p>
            )}
          </Campo>
          <button
            onClick={guardarDatos}
            disabled={guardando}
            className="btn-primary"
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </section>

      {/* Seguridad (solo con sesión) */}
      {sesionEmail && (
        <section className="card p-5">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-gris">
            Seguridad
          </h2>
          <div className="space-y-4">
            <Campo label="Nueva contraseña">
              <Input value={pass1} onChange={setPass1} placeholder="Mínimo 6 caracteres" type="password" />
            </Campo>
            <Campo label="Confirmar contraseña">
              <Input value={pass2} onChange={setPass2} placeholder="Repite la contraseña" type="password" />
            </Campo>
            <button
              onClick={actualizarClave}
              disabled={cambiandoPass || !pass1}
              className="btn-secondary text-verde-medio"
            >
              {cambiandoPass ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </div>
        </section>
      )}

      {/* Cuenta */}
      <section className="card p-5">
        {sesionEmail ? (
          <button
            onClick={salirNube}
            className="btn w-full bg-rojo-bg text-rojo"
          >
            <span aria-hidden>⏏</span> Cerrar sesión
          </button>
        ) : hayNube() ? (
          <button
            onClick={abrirAuth}
            className="btn-primary"
          >
            Iniciar sesión / Crear cuenta
          </button>
        ) : (
          <p className="text-center text-[13px] text-gris">
            Modo solo-local: configura Supabase (.env) para sincronizar tu cuenta.
          </p>
        )}
      </section>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="field disabled:bg-crema disabled:text-gris"
    />
  )
}
