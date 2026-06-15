import { useState } from 'react'
import { DEUDAS_INIT } from '../lib/constantes'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Deuda, TipoDeuda } from '../types'

type DeudaNueva = Omit<Deuda, 'id'>
type Paso = 'bienvenida' | 'ingreso' | 'inicio' | 'deudas'

/** Configuración inicial: ingreso y deudas propias (en vez de datos de ejemplo). */
export function Onboarding() {
  const { completarOnboarding } = useApp()
  const [paso, setPaso] = useState<Paso>('bienvenida')
  const [ingreso, setIngreso] = useState('')
  const [deudas, setDeudas] = useState<DeudaNueva[]>([])

  const finalizar = (lista: DeudaNueva[]) => {
    completarOnboarding({ ingresoMensual: parseFloat(ingreso) || 0, deudas: lista })
  }

  const usarEjemplo = () => finalizar(DEUDAS_INIT.map(({ id: _id, ...rest }) => rest))
  const empezarVacio = () => finalizar([])

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-crema">
      <div className="mx-auto flex min-h-full max-w-app flex-col px-5 pb-10 pt-[calc(env(safe-area-inset-top)+40px)] lg:max-w-md lg:justify-center">
        {paso === 'bienvenida' && (
          <Tarjeta>
            <div className="mb-3 text-5xl">💚</div>
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido a Mi Plan</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-gris">
              En unos pasos vas a configurar tu plan para salir de deudas con la estrategia bola de
              nieve. Empecemos.
            </p>
            <Boton onClick={() => setPaso('ingreso')}>Comenzar</Boton>
          </Tarjeta>
        )}

        {paso === 'ingreso' && (
          <Tarjeta>
            <Paso n={1} total={3} />
            <h1 className="mt-2 text-xl font-bold">¿Cuánto ingresas al mes?</h1>
            <p className="mt-1 text-[13px] text-gris">
              Nos ayuda a calcular cuánto puedes destinar a tus deudas. Puedes cambiarlo luego.
            </p>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Ej: 2.500.000"
              value={ingreso}
              onChange={(e) => setIngreso(e.target.value)}
              className="mt-4 w-full rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-3 text-base outline-none focus:border-verde-vivo focus:ring-4 focus:ring-verde-vivo/15"
            />
            <Boton onClick={() => setPaso('inicio')}>Continuar</Boton>
            <Secundario onClick={() => setPaso('inicio')}>Omitir por ahora</Secundario>
          </Tarjeta>
        )}

        {paso === 'inicio' && (
          <Tarjeta>
            <Paso n={2} total={3} />
            <h1 className="mt-2 text-xl font-bold">¿Cómo quieres empezar?</h1>
            <p className="mt-1 text-[13px] text-gris">Elige una opción para cargar tus deudas.</p>
            <div className="mt-4 space-y-2.5">
              <Opcion
                ico="📝"
                titulo="Agregar mis deudas"
                sub="Ingresa tus deudas reales una por una"
                onClick={() => setPaso('deudas')}
              />
              <Opcion
                ico="🧪"
                titulo="Usar datos de ejemplo"
                sub="Para explorar la app con deudas de muestra"
                onClick={usarEjemplo}
              />
              <Opcion
                ico="🌱"
                titulo="Empezar de cero"
                sub="Sin deudas; las agregas después"
                onClick={empezarVacio}
              />
            </div>
          </Tarjeta>
        )}

        {paso === 'deudas' && (
          <PasoDeudas
            deudas={deudas}
            setDeudas={setDeudas}
            onFinalizar={() => finalizar(deudas)}
          />
        )}
      </div>
    </div>
  )
}

function PasoDeudas({
  deudas,
  setDeudas,
  onFinalizar,
}: {
  deudas: DeudaNueva[]
  setDeudas: (d: DeudaNueva[]) => void
  onFinalizar: () => void
}) {
  const { notificar } = useApp()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoDeuda>('tarjeta')
  const [saldo, setSaldo] = useState('')
  const [tasaEA, setTasaEA] = useState('')
  const [cuota, setCuota] = useState('')

  const agregar = () => {
    const nom = nombre.trim()
    const nSaldo = parseFloat(saldo)
    const nTasa = parseFloat(tasaEA)
    if (!nom) return notificar('Ponle un nombre a la deuda')
    if (!nSaldo || nSaldo <= 0) return notificar('Ingresa un saldo válido')
    if (isNaN(nTasa) || nTasa < 0) return notificar('Ingresa la tasa E.A.')
    setDeudas([
      ...deudas,
      {
        nombre: nom,
        tipo,
        saldoInicial: nSaldo,
        saldo: nSaldo,
        tasaEA: nTasa,
        cuota: parseFloat(cuota) || 0,
        orden: deudas.length + 1,
      },
    ])
    setNombre('')
    setSaldo('')
    setTasaEA('')
    setCuota('')
  }

  return (
    <Tarjeta>
      <Paso n={3} total={3} />
      <h1 className="mt-2 text-xl font-bold">Agrega tus deudas</h1>
      <p className="mt-1 text-[13px] text-gris">
        Ordénalas mentalmente de la que quieres pagar primero a la última.
      </p>

      {deudas.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {deudas.map((d, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl bg-crema px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {i + 1}. {d.nombre}
              </span>
              <span className="text-gris">{fmt(d.saldo)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2.5 rounded-2xl border border-linea bg-white p-3.5">
        <input
          placeholder="Nombre (Ej: Tarjeta Visa)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-lg border-[1.5px] border-linea px-3 py-2.5 text-[15px] outline-none focus:border-verde-vivo"
        />
        <div className="flex gap-2">
          {(['tarjeta', 'credito'] as TipoDeuda[]).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`flex-1 rounded-lg border-[1.5px] py-2 text-[13px] font-semibold transition ${
                tipo === t ? 'border-verde-prof bg-verde-prof text-crema' : 'border-linea text-gris'
              }`}
            >
              {t === 'tarjeta' ? 'Tarjeta' : 'Crédito'}
            </button>
          ))}
        </div>
        <input
          placeholder="Saldo que debes"
          type="number"
          inputMode="numeric"
          value={saldo}
          onChange={(e) => setSaldo(e.target.value)}
          className="w-full rounded-lg border-[1.5px] border-linea px-3 py-2.5 text-[15px] outline-none focus:border-verde-vivo"
        />
        <div className="flex gap-2">
          <input
            placeholder="Tasa % E.A."
            type="number"
            inputMode="decimal"
            value={tasaEA}
            onChange={(e) => setTasaEA(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-linea px-3 py-2.5 text-[15px] outline-none focus:border-verde-vivo"
          />
          <input
            placeholder="Cuota mensual"
            type="number"
            inputMode="numeric"
            value={cuota}
            onChange={(e) => setCuota(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-linea px-3 py-2.5 text-[15px] outline-none focus:border-verde-vivo"
          />
        </div>
        <button
          onClick={agregar}
          className="w-full rounded-lg bg-verde-claro py-2.5 text-[13px] font-semibold text-verde-medio"
        >
          + Agregar a la lista
        </button>
      </div>

      <Boton onClick={onFinalizar}>
        {deudas.length > 0 ? `Finalizar con ${deudas.length} deuda${deudas.length > 1 ? 's' : ''}` : 'Finalizar sin deudas'}
      </Boton>
    </Tarjeta>
  )
}

// --- piezas ---

function Tarjeta({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-white p-6 shadow-suave-lg">{children}</div>
}

function Paso({ n, total }: { n: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < n ? 'bg-verde-vivo' : 'bg-linea'}`}
        />
      ))}
    </div>
  )
}

function Boton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="mt-5 w-full rounded-[13px] bg-verde-prof py-[15px] text-[15px] font-semibold text-crema transition active:scale-[.99]"
    >
      {children}
    </button>
  )
}

function Secundario({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="mt-2 w-full py-2 text-center text-[13px] font-medium text-gris">
      {children}
    </button>
  )
}

function Opcion({
  ico,
  titulo,
  sub,
  onClick,
}: {
  ico: string
  titulo: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-linea bg-white p-3.5 text-left transition hover:border-verde-vivo hover:bg-verde-claro/40"
    >
      <span className="text-2xl">{ico}</span>
      <span className="flex-1">
        <span className="block text-[15px] font-semibold">{titulo}</span>
        <span className="block text-[12px] text-gris">{sub}</span>
      </span>
      <span className="text-gris-claro">›</span>
    </button>
  )
}
