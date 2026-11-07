import { useState } from 'react'
import { MoneyInput } from '../components/MoneyInput'
import { SheetTitulo } from '../components/SheetTitulo'
import { repartoProporcional } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useEscape } from '../lib/useEscape'
import { useApp } from '../store/AppContext'
import { usePareja } from '../store/usePareja'
import type { EspacioGasto } from '../types'

export function Pareja() {
  const { abrirAuth, notificar } = useApp()
  const p = usePareja()

  const [modalDatos, setModalDatos] = useState(false)
  const [modalGasto, setModalGasto] = useState<EspacioGasto | 'nuevo' | null>(null)

  if (p.sinSesion) {
    return (
      <Centro
        ico="💑"
        titulo="Plan en pareja"
        texto="Esta sección es compartida y vive en la nube. Inicia sesión para crear o unirte a un espacio con tu pareja."
        accion={{ label: 'Iniciar sesión', onClick: abrirAuth }}
      />
    )
  }

  if (p.cargando) {
    return (
      <div className="grid place-items-center py-16">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-linea border-t-verde-vivo" />
      </div>
    )
  }

  if (!p.espacio) {
    return <CrearOUnirse crear={p.crear} unirse={p.unirse} notificar={notificar} />
  }

  const total = p.gastos.reduce((s, g) => s + g.montoMensual, 0)
  const reparto = repartoProporcional(
    total,
    p.miembros.map((m) => ({ userId: m.userId, ingreso: m.ingreso })),
  )
  const yo = p.miembros.find((m) => m.esYo)
  const nombreDe = (uid: string) => {
    const m = p.miembros.find((x) => x.userId === uid)
    if (!m) return 'Miembro'
    if (m.esYo) return m.nombre || 'Tú'
    return m.nombre || 'Tu pareja'
  }

  return (
    <>
      {/* Encabezado del espacio + invitar */}
      <section className="mb-4 card p-[18px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold uppercase tracking-wide text-gris">Espacio</div>
            <div className="truncate text-lg font-bold">{p.espacio.nombre}</div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gris">Código para invitar</div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(p.espacio!.codigo).catch(() => {})
                notificar('Código copiado: ' + p.espacio!.codigo)
              }}
              className="font-mono text-lg font-bold tracking-widest text-verde-medio"
            >
              {p.espacio.codigo}
            </button>
          </div>
        </div>
        {p.miembros.length < 2 && (
          <p className="mt-2 rounded-lg bg-verde-claro/60 px-3 py-2 text-[12px] text-verde-medio">
            Comparte el código <strong>{p.espacio.codigo}</strong> con tu pareja para que se una.
          </p>
        )}
      </section>

      {/* Ingresos de cada quien */}
      <section className="mb-4 card p-[18px]">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gris">Ingresos</h2>
        <div className="space-y-2">
          {p.miembros.map((m) => (
            <div key={m.userId} className="flex items-center justify-between rounded-xl bg-crema px-3.5 py-2.5">
              <span className="text-sm font-medium">
                {m.esYo ? `${m.nombre || 'Tú'} (tú)` : m.nombre || 'Tu pareja'}
              </span>
              <span className="font-bold">{m.ingreso > 0 ? fmt(m.ingreso) : '—'}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setModalDatos(true)}
          className="btn-soft mt-3 w-full"
        >
          Editar mi nombre e ingreso
        </button>
      </section>

      {/* Gastos compartidos por categoría */}
      <section className="mb-4 card p-[18px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gris">
            Gastos del mes
          </h2>
          <span className="text-sm font-bold">{fmt(total)}</span>
        </div>
        {p.gastos.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-gris-claro">
            Agrega arriendo, comida, servicios, etc.
          </p>
        ) : (
          <div className="space-y-1.5">
            {p.gastos.map((g) => (
              <button
                key={g.id}
                onClick={() => setModalGasto(g)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-crema"
              >
                <span
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-base"
                  style={{ background: g.color + '1A' }}
                >
                  {g.icono}
                </span>
                <span className="flex-1 text-sm font-medium">{g.nombre}</span>
                <span className="font-semibold">{fmt(g.montoMensual)}</span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setModalGasto('nuevo')}
          className="btn-dashed mt-3 min-h-[44px] text-[14px]"
        >
          + Agregar gasto
        </button>
      </section>

      {/* Reparto proporcional */}
      <section className="hero">
        <div className="text-xs font-medium opacity-70">CÓMO SE REPARTE</div>
        <p className="mb-3 mt-0.5 text-[12.5px] opacity-65">Proporcional a lo que gana cada uno</p>
        {total === 0 ? (
          <p className="text-[13px] opacity-80">Agrega gastos para ver el reparto.</p>
        ) : (
          <div className="space-y-2.5">
            {reparto.map((r) => (
              <div key={r.userId}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="opacity-85">{nombreDe(r.userId)}</span>
                  <span className="font-bold">
                    {fmt(r.aporte)} <span className="opacity-70">· {r.pct}%</span>
                  </span>
                </div>
                <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-verde-vivo" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modales */}
      {modalDatos && yo && (
        <ModalMisDatos
          nombre={yo.nombre}
          ingreso={yo.ingreso}
          onCerrar={() => setModalDatos(false)}
          onGuardar={(n, i) => {
            void p.guardarIngreso(n, i)
            setModalDatos(false)
          }}
        />
      )}
      {modalGasto && (
        <ModalGasto
          gasto={modalGasto === 'nuevo' ? null : modalGasto}
          onCerrar={() => setModalGasto(null)}
          onGuardar={(nombre, monto) => {
            if (modalGasto === 'nuevo') {
              void p.agregarGasto({ nombre, icono: '🏠', color: '#1D6E56', montoMensual: monto })
            } else {
              void p.editarGasto({ ...modalGasto, nombre, montoMensual: monto })
            }
            setModalGasto(null)
          }}
          onEliminar={
            modalGasto === 'nuevo'
              ? undefined
              : () => {
                  void p.borrarGasto(modalGasto.id)
                  setModalGasto(null)
                }
          }
        />
      )}
    </>
  )
}

// ---------- Crear o unirse ----------

function CrearOUnirse({
  crear,
  unirse,
  notificar,
}: {
  crear: (n: string) => Promise<void>
  unirse: (c: string) => Promise<void>
  notificar: (m: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)

  const hacer = async (fn: () => Promise<void>, errMsg: string) => {
    setCargando(true)
    try {
      await fn()
    } catch (e) {
      notificar(e instanceof Error ? traducir(e.message) : errMsg)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 text-center">
        <div className="mb-2 text-4xl">💑</div>
        <div className="text-[15px] font-semibold">Plan en pareja</div>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-gris">
          Compartan gastos y vean cuánto aporta cada quien según su ingreso.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gris">Crear un espacio</h2>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          aria-label="Nombre del espacio"
          placeholder="Nombre (ej: Nuestro hogar)"
          className="mb-3 field"
        />
        <button
          onClick={() => hacer(() => crear(nombre), 'No se pudo crear')}
          disabled={cargando}
          className="btn-primary"
        >
          Crear espacio
        </button>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gris">Unirme con un código</h2>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          aria-label="Código de invitación"
          placeholder="Código (ej: A1B2C3)"
          className="mb-3 field text-center font-mono tracking-widest"
        />
        <button
          onClick={() => hacer(() => unirse(codigo), 'No se pudo unir')}
          disabled={cargando || codigo.trim().length < 4}
          className="btn-secondary text-verde-medio"
        >
          Unirme
        </button>
      </section>
    </div>
  )
}

function traducir(msg: string): string {
  if (msg.includes('Código inválido')) return 'Código inválido.'
  if (msg.includes('completo')) return 'Ese espacio ya está completo (2 personas).'
  if (msg.includes('Ya perteneces')) return 'Ya perteneces a un espacio.'
  return 'No se pudo completar. Inténtalo de nuevo.'
}

// ---------- Modales ----------

function ModalMisDatos({
  nombre: nombreInicial,
  ingreso: ingresoInicial,
  onCerrar,
  onGuardar,
}: {
  nombre: string
  ingreso: number
  onCerrar: () => void
  onGuardar: (nombre: string, ingreso: number) => void
}) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [ingreso, setIngreso] = useState(ingresoInicial ? String(Math.round(ingresoInicial)) : '')
  return (
    <Sheet titulo="Mis datos" onCerrar={onCerrar}>
      <label htmlFor="pareja-nombre" className="field-label">Tu nombre</label>
      <input
        id="pareja-nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Tu nombre"
        className="mb-4 field"
      />
      <label htmlFor="pareja-ingreso" className="field-label">Tu ingreso mensual</label>
      <div className="mb-4">
        <MoneyInput id="pareja-ingreso" value={ingreso} onChange={setIngreso} />
      </div>
      <button
        onClick={() => onGuardar(nombre.trim(), parseFloat(ingreso) || 0)}
        className="btn-primary"
      >
        Guardar
      </button>
    </Sheet>
  )
}

function ModalGasto({
  gasto,
  onCerrar,
  onGuardar,
  onEliminar,
}: {
  gasto: EspacioGasto | null
  onCerrar: () => void
  onGuardar: (nombre: string, monto: number) => void
  onEliminar?: () => void
}) {
  const { notificar } = useApp()
  const [nombre, setNombre] = useState(gasto?.nombre ?? '')
  const [monto, setMonto] = useState(gasto ? String(Math.round(gasto.montoMensual)) : '')
  return (
    <Sheet titulo={gasto ? 'Editar gasto' : 'Nuevo gasto'} onCerrar={onCerrar}>
      <label htmlFor="gasto-nombre" className="field-label">Nombre</label>
      <input
        id="gasto-nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej: Arriendo, Comida, Servicios..."
        autoFocus
        className="mb-4 field"
      />
      <label htmlFor="gasto-monto" className="field-label">Monto mensual</label>
      <div className="mb-4">
        <MoneyInput id="gasto-monto" value={monto} onChange={setMonto} />
      </div>
      <button
        onClick={() => {
          if (!nombre.trim()) return notificar('Ponle un nombre al gasto')
          const v = parseFloat(monto)
          if (!v || v <= 0) return notificar('Ingresa un monto válido')
          onGuardar(nombre.trim(), v)
        }}
        className="btn-primary"
      >
        Guardar
      </button>
      {onEliminar && (
        <button
          onClick={onEliminar}
          className="btn-danger mt-2.5"
        >
          Eliminar
        </button>
      )}
    </Sheet>
  )
}

function Sheet({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  useEscape(true, onCerrar)
  return (
    <div
      className="sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="sheet">
        <div className="sheet-grab" />
        <SheetTitulo onCerrar={onCerrar}>{titulo}</SheetTitulo>
        {children}
      </div>
    </div>
  )
}

function Centro({
  ico,
  titulo,
  texto,
  accion,
}: {
  ico: string
  titulo: string
  texto: string
  accion?: { label: string; onClick: () => void }
}) {
  return (
    <div className="card px-6 py-12 text-center">
      <div className="mb-2 text-4xl">{ico}</div>
      <div className="text-[15px] font-semibold">{titulo}</div>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-gris">{texto}</p>
      {accion && (
        <button
          onClick={accion.onClick}
          className="btn mt-4 bg-verde-prof px-6 text-crema"
        >
          {accion.label}
        </button>
      )}
    </div>
  )
}
