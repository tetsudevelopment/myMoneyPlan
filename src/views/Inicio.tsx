import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { GraficoFlujo, type PuntoFlujo } from '../components/GraficoFlujo'
import { Hero } from '../components/Hero'
import { InstallBanner } from '../components/InstallBanner'
import { Stat } from '../components/Stat'
import { mesActual, nombreMes, nombreMesActual, saludo } from '../lib/fechas'
import { flujoDiario, flujoMensual, statsDelMes } from '../lib/finanzas'
import { fmt, fmtUSD } from '../lib/format'
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
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] text-gris">{saludo()} 👋</p>
          <h1 className="truncate text-[24px] font-bold leading-tight tracking-tight text-carbon">
            {perfil.nombre || 'Tu resumen'}
          </h1>
        </div>
        <button
          onClick={onPerfil}
          aria-label="Ir a mi perfil"
          className="flex-shrink-0 rounded-full shadow-suave ring-2 ring-white transition active:scale-95"
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
          <Hero
            className="mb-4 lg:mb-0"
            label={`DISPONIBLE EN ${mes.toUpperCase()}`}
            valor={fmt(stats.disponible)}
            detalle={
              positivo ? 'Te queda margen este mes 👏' : 'Cuidado: gastaste más de lo que ingresó 🫣'
            }
          >
            {insight && (
              <div className="mt-4 inline-flex min-h-[32px] items-center rounded-full bg-white/12 px-3.5 text-[12.5px] font-medium">
                {insight}
              </div>
            )}
          </Hero>

          {/* Gráfico ingresos vs gastos */}
          <section className="card mb-4 p-[18px] lg:mb-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="eyebrow">
                  Ingresos vs gastos
                </h2>
                <p className="mt-1 text-[12px] text-gris">
                  {meses === 1 ? `Día a día · ${mes}` : `Últimos ${meses} meses`}
                </p>
              </div>
              <div className="seg self-start !rounded-xl p-0.5 sm:flex-shrink-0">
                {RANGOS.map((r) => (
                  <button
                    key={r.meses}
                    onClick={() => setMeses(r.meses)}
                    aria-pressed={meses === r.meses}
                    className="seg-btn !min-h-[40px] !flex-none !px-3 !text-[13px]"
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
          <Stat label={`Ingresos · ${mes}`} valor={fmt(stats.ingresado)} tono="verde" />
          <Stat label={`Gastos · ${mes}`} valor={fmt(stats.gastado)} tono="rojo" />
          <Stat label="Abonado a deudas" valor={fmt(stats.pagado)} />
          <Stat label="Disponible" valor={fmt(stats.disponible)} tono={positivo ? 'verde' : 'rojo'} />
          {stats.ingresadoUSD > 0 && (
            <p className="col-span-2 px-1 text-[12px] text-gris lg:col-span-1">
              + {fmtUSD(stats.ingresadoUSD)} recibidos en dólares este mes (aparte, sin convertir)
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
