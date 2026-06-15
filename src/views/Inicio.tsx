import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { GraficoFlujo, type PuntoFlujo } from '../components/GraficoFlujo'
import { InstallBanner } from '../components/InstallBanner'
import { mesActual, nombreMes, nombreMesActual, saludo } from '../lib/fechas'
import { flujoDiario, flujoMensual, statsDelMes } from '../lib/finanzas'
import { fmt } from '../lib/format'
import { useApp } from '../store/AppContext'

const RANGOS: { label: string; meses: number }[] = [
  { label: 'Mes', meses: 1 },
  { label: '3M', meses: 3 },
  { label: '6M', meses: 6 },
  { label: '12M', meses: 12 },
]

const etiquetaMes = (ym: string) => nombreMes(Number(ym.split('-')[1]) - 1).slice(0, 3)

export function Inicio({ onPerfil }: { onPerfil: () => void }) {
  const { estado, perfil, sesionEmail } = useApp()
  const [meses, setMeses] = useState(6)
  const stats = statsDelMes(estado.movimientos, mesActual())
  const mes = nombreMesActual()
  const positivo = stats.disponible >= 0

  // Insight contextual: comparación de gastos con el mes pasado.
  const dosMeses = flujoMensual(estado.movimientos, mesActual(), 2)
  const gastoAnterior = dosMeses[0].gastos
  const gastoEste = dosMeses[1].gastos
  let insight: string | null = null
  if (gastoAnterior > 0) {
    const diff = Math.round(((gastoEste - gastoAnterior) / gastoAnterior) * 100)
    if (diff < 0) insight = `Gastas ${Math.abs(diff)}% menos que el mes pasado 🎉`
    else if (diff > 0) insight = `Gastas ${diff}% más que el mes pasado`
  }

  const datos: PuntoFlujo[] =
    meses === 1
      ? flujoDiario(estado.movimientos, mesActual()).map((d) => ({
          etiqueta: String(d.dia),
          ingresos: d.ingresos,
          gastos: d.gastos,
        }))
      : flujoMensual(estado.movimientos, mesActual(), meses).map((m) => ({
          etiqueta: etiquetaMes(m.mes),
          ingresos: m.ingresos,
          gastos: m.gastos,
        }))

  return (
    <div>
      {/* Saludo personalizado */}
      <header className="mb-5 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-gris">{saludo()} 👋</p>
          <h1 className="truncate text-[22px] font-bold tracking-tight text-carbon">
            {perfil.nombre || 'Tu resumen'}
          </h1>
        </div>
        <button
          onClick={onPerfil}
          aria-label="Ir a mi perfil"
          className="flex-shrink-0 rounded-full ring-2 ring-white shadow-suave transition active:scale-95"
        >
          <Avatar
            src={perfil.avatar}
            nombre={perfil.nombre}
            email={sesionEmail}
            className="h-11 w-11 rounded-full text-base"
          />
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-5">
        {/* Columna izquierda: balance + gráfico */}
        <div className="min-w-0 lg:space-y-4">
          <InstallBanner />

          {/* Tarjeta de balance (acento) */}
          <section className="mb-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-verde-prof to-verde-medio p-[22px] text-crema shadow-suave-lg lg:mb-0 lg:p-7">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-base">
                💰
              </span>
              <p className="text-xs font-medium tracking-wide opacity-75">
                DISPONIBLE EN {mes.toUpperCase()}
              </p>
            </div>
            <p className="my-1.5 text-[34px] font-bold leading-none tracking-tight lg:text-[42px]">
              {fmt(stats.disponible)}
            </p>
            <p className="text-[12.5px] opacity-65">
              {positivo
                ? 'Te queda margen este mes 👏'
                : 'Cuidado: gastaste más de lo que ingresó 🫣'}
            </p>
            {insight && (
              <div className="mt-4 inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[11.5px] font-medium">
                {insight}
              </div>
            )}
          </section>

          {/* Gráfico ingresos vs gastos */}
          <section className="mb-4 rounded-card bg-white p-[18px] shadow-suave lg:mb-0">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gris">
                  Ingresos vs gastos
                </h2>
                <p className="mt-0.5 text-[11.5px] text-gris-claro">
                  {meses === 1 ? `Día a día · ${mes}` : `Últimos ${meses} meses`}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-1 rounded-xl bg-crema p-1">
                {RANGOS.map((r) => (
                  <button
                    key={r.meses}
                    onClick={() => setMeses(r.meses)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      meses === r.meses ? 'bg-verde-prof text-crema' : 'text-gris'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <GraficoFlujo datos={datos} />
          </section>
        </div>

        {/* Columna derecha: detalle del mes */}
        <section className="grid min-w-0 grid-cols-2 gap-2.5 lg:grid-cols-1">
          <Mini label={`Ingresos · ${mes}`} valor={fmt(stats.ingresado)} tono="verde" />
          <Mini label={`Gastos · ${mes}`} valor={fmt(stats.gastado)} tono="rojo" />
          <Mini label="Abonado a deudas" valor={fmt(stats.pagado)} />
          <Mini label="Disponible" valor={fmt(stats.disponible)} tono={positivo ? 'verde' : 'rojo'} />
        </section>
      </div>
    </div>
  )
}

function Mini({ label, valor, tono }: { label: string; valor: string; tono?: 'verde' | 'rojo' }) {
  const color = tono === 'verde' ? 'text-verde-vivo' : tono === 'rojo' ? 'text-rojo' : ''
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-suave">
      <p className="text-[11px] font-medium text-gris">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tracking-tight ${color}`}>{valor}</p>
    </div>
  )
}
