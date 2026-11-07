import { useState } from 'react'
import { DeudaCard } from '../components/DeudaCard'
import { Hero } from '../components/Hero'
import { Icon } from '../components/Icon'
import { ModalDeuda } from '../components/ModalDeuda'
import { Stat } from '../components/Stat'
import { mesActual, nombreMesActual } from '../lib/fechas'
import {
  deudaInicialTotal,
  deudaObjetivo,
  deudaTotalActual,
  deudasVivas,
  pctPagadoTotal,
} from '../lib/finanzas'
import { fmt, fmtK } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Deuda } from '../types'

export function Deudas({ onAbonar }: { onAbonar: (deudaId: string) => void }) {
  const { estado, aplicarInteresesMes } = useApp()
  const vivas = deudasVivas(estado.deudas)
  const objetivoId = deudaObjetivo(estado.deudas)?.id
  const ordenadas = [...estado.deudas].sort((a, b) => a.orden - b.orden)
  const cuotaTotal = vivas.reduce((s, d) => s + d.cuota, 0)
  const ordenSugerido = (estado.deudas.reduce((m, d) => Math.max(m, d.orden), 0) || 0) + 1

  const yaAplicado = estado.interesesAplicados.includes(mesActual())
  const mes = nombreMesActual()

  const [modal, setModal] = useState(false)
  const [editar, setEditar] = useState<Deuda | null>(null)

  const abrirNueva = () => {
    setEditar(null)
    setModal(true)
  }
  const abrirEditar = (d: Deuda) => {
    setEditar(d)
    setModal(true)
  }

  const totalRestante = deudaTotalActual(estado.deudas)
  const totalInicial = deudaInicialTotal(estado.deudas)
  const pctTotal = pctPagadoTotal(estado.deudas)

  return (
    <>
      {estado.deudas.length > 0 && (
        <Hero
          label="DEUDA TOTAL RESTANTE"
          valor={fmt(totalRestante)}
          detalle={`de ${fmt(totalInicial)} inicial`}
        >
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-verde-vivo transition-all duration-700"
              style={{ width: `${pctTotal}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-crema/75">
            <span>{pctTotal}% pagado</span>
            <span>
              {vivas.length} {vivas.length === 1 ? 'deuda activa' : 'deudas activas'}
            </span>
          </div>
        </Hero>
      )}

      <section className="mb-4 mt-0 grid grid-cols-2 gap-2.5 sm:max-w-md">
        <Stat label="Deudas activas" valor={String(vivas.length)} />
        <Stat label="Cuota mensual" valor={fmtK(cuotaTotal)} />
      </section>

      {estado.deudas.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-verde-claro text-verde-medio">
            <Icon name="card" className="h-7 w-7" />
          </div>
          <div className="text-[16px] font-semibold">Aún no tienes deudas</div>
          <p className="mx-auto mt-1 max-w-xs text-[14px] text-gris">
            Agrega tus deudas para armar tu plan de pago.
          </p>
          <button
            onClick={abrirNueva}
            className="btn mt-4 bg-verde-prof px-6 text-crema"
          >
            + Agregar deuda
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ordenadas.map((d) => (
              <DeudaCard
                key={d.id}
                deuda={d}
                esObjetivo={d.id === objetivoId}
                onAbonar={onAbonar}
                onEditar={abrirEditar}
              />
            ))}
          </div>

          <button
            onClick={abrirNueva}
            className="mb-4 btn-dashed md:max-w-xs"
          >
            + Agregar deuda
          </button>

          <div className="md:max-w-lg">
            <button
              onClick={aplicarInteresesMes}
              disabled={yaAplicado}
              className={`btn w-full border ${
                yaAplicado
                  ? 'border-[#bfe6d6] bg-verde-claro text-verde-medio'
                  : 'border-[#F0D5BC] bg-white text-ambar'
              }`}
            >
              {yaAplicado ? `✓ Intereses de ${mes} ya aplicados` : `↻ Aplicar intereses de ${mes}`}
            </button>
            <p className="mt-2 px-1 text-center text-[12px] leading-relaxed text-gris">
              {yaAplicado
                ? 'Listo por este mes. Vuelve el próximo mes cuando lleguen tus nuevos extractos.'
                : 'Úsalo una vez al mes, cuando lleguen tus nuevos extractos, para sumar los intereses que cobran los bancos.'}
            </p>
          </div>
        </>
      )}

      <ModalDeuda
        abierto={modal}
        onCerrar={() => setModal(false)}
        deudaEditar={editar}
        ordenSugerido={ordenSugerido}
      />
    </>
  )
}
