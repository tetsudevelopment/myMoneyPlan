import { useState } from 'react'
import { Hero } from '../components/Hero'
import { Icon, type IconName } from '../components/Icon'
import { ModalBolsillo } from '../components/ModalBolsillo'
import { ModalConvertir } from '../components/ModalConvertir'
import { ModalMonto } from '../components/ModalMonto'
import { ModalPrestamo } from '../components/ModalPrestamo'
import { totalesBolsillos } from '../lib/finanzas'
import { fmt, fmtUSD } from '../lib/format'
import { useApp } from '../store/AppContext'
import type { Bolsillo, Moneda } from '../types'

type Tab = 'ahorro' | 'prestado'

export function Ahorro() {
  const { estado, ajustarBolsillo, eliminarBolsillo, abonarPrestamo, eliminarPrestamo } = useApp()
  const [tab, setTab] = useState<Tab>('ahorro')

  // Modales
  const [modalBolsillo, setModalBolsillo] = useState(false)
  const [editarBolsilloObj, setEditarBolsilloObj] = useState<Bolsillo | null>(null)
  const [modalPrestamo, setModalPrestamo] = useState(false)
  const [convertirObj, setConvertirObj] = useState<Bolsillo | null>(null)
  const [montoAccion, setMontoAccion] = useState<{
    titulo: string
    confirmar: string
    moneda: Moneda
    onOk: (m: number) => void
  } | null>(null)

  const { cop: totalAhorro, usd: totalAhorroUSD } = totalesBolsillos(estado.bolsillos)
  const totalPorCobrar = estado.prestamos.reduce((s, p) => s + Math.max(0, p.monto - p.abonado), 0)

  return (
    <>
      {/* Tabs */}
      <div className="seg mb-4 md:max-w-sm">
        <TabBtn activo={tab === 'ahorro'} onClick={() => setTab('ahorro')}>
          Ahorro
        </TabBtn>
        <TabBtn activo={tab === 'prestado'} onClick={() => setTab('prestado')}>
          Prestado
        </TabBtn>
      </div>

      {tab === 'ahorro' ? (
        <>
          <Hero
            label="TOTAL AHORRADO"
            valor={fmt(totalAhorro)}
            detalle={totalAhorroUSD > 0 ? `+ ${fmtUSD(totalAhorroUSD)} en dólares` : undefined}
          />

          {estado.bolsillos.length === 0 ? (
            <Vacio
              ico="piggy"
              titulo="Sin bolsillos todavía"
              texto="Crea un bolsillo para empezar a ahorrar."
            />
          ) : (
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {estado.bolsillos.map((b) => (
                <div key={b.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[16px] font-semibold">{b.nombre}</span>
                        {b.moneda === 'USD' && (
                          <span className="rounded-md bg-azul/15 px-1.5 py-0.5 text-[10px] font-bold text-azul">
                            USD
                          </span>
                        )}
                      </div>
                      {b.entidad && <div className="text-[12px] text-gris">{b.entidad}</div>}
                      <div className="mt-1.5 text-[26px] font-bold leading-none tracking-tight">
                        {b.moneda === 'USD' ? fmtUSD(b.saldo) : fmt(b.saldo)}
                      </div>
                    </div>
                    <div className="-mr-2 -mt-2 flex flex-shrink-0">
                      <IconBtn label="Editar" onClick={() => setEditarBolsilloObj(b)}><Icon name="edit" className="h-[18px] w-[18px]" /></IconBtn>
                      <IconBtn label="Eliminar" onClick={() => void eliminarBolsillo(b.id)}><Icon name="trash" className="h-[18px] w-[18px]" /></IconBtn>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setMontoAccion({
                          titulo: `Aportar a ${b.nombre}`,
                          confirmar: 'Aportar',
                          moneda: b.moneda,
                          onOk: (m) => ajustarBolsillo(b.id, m),
                        })
                      }
                      className="btn-soft"
                    >
                      + Aportar
                    </button>
                    <button
                      onClick={() =>
                        setMontoAccion({
                          titulo: `Retirar de ${b.nombre}`,
                          confirmar: 'Retirar',
                          moneda: b.moneda,
                          onOk: (m) => ajustarBolsillo(b.id, -m),
                        })
                      }
                      className="btn-soft !bg-crema !text-gris"
                    >
                      − Retirar
                    </button>
                  </div>
                  {b.moneda === 'USD' && (
                    <button
                      onClick={() => setConvertirObj(b)}
                      disabled={b.saldo <= 0}
                      className="btn mt-2 min-h-[44px] w-full bg-verde-prof text-[14px] text-crema"
                    >
                      Convertir a pesos
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <BotonNuevo onClick={() => setModalBolsillo(true)}>+ Nuevo bolsillo</BotonNuevo>
        </>
      ) : (
        <>
          <Hero label="TOTAL POR COBRAR" valor={fmt(totalPorCobrar)} />

          {estado.prestamos.length === 0 ? (
            <Vacio
              ico="hand"
              titulo="Sin préstamos registrados"
              texto="Registra el dinero que prestaste para no perderle el rastro."
            />
          ) : (
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {estado.prestamos.map((p) => {
                const pendiente = Math.max(0, p.monto - p.abonado)
                const pagado = pendiente <= 0
                const pct = p.monto > 0 ? Math.round((p.abonado / p.monto) * 100) : 0
                return (
                  <div
                    key={p.id}
                    className={`card ${pagado ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-[16px] font-semibold">{p.persona}</div>
                        <div className="mt-0.5 text-[12px] text-gris">
                          {p.nota ? `${p.nota} · ` : ''}
                          {p.fecha}
                        </div>
                      </div>
                      <IconBtn label="Eliminar" onClick={() => void eliminarPrestamo(p.id)}><Icon name="trash" className="h-[18px] w-[18px]" /></IconBtn>
                    </div>

                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gris">
                          {pagado ? 'Pagado' : 'Te debe'}
                        </div>
                        <div className="text-[26px] font-bold leading-tight tracking-tight">
                          {pagado ? fmt(p.monto) : fmt(pendiente)}
                        </div>
                      </div>
                      <div className="text-right text-[12px] text-gris">de {fmt(p.monto)}</div>
                    </div>

                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-linea">
                      <div className="h-full rounded-full bg-verde-vivo" style={{ width: `${pct}%` }} />
                    </div>

                    {pagado ? (
                      <div className="mt-3.5 rounded-[14px] bg-verde-claro py-2.5 text-center text-[13px] font-semibold text-verde-medio">
                        ✓ Te pagó todo
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setMontoAccion({
                            titulo: `Abono de ${p.persona}`,
                            confirmar: 'Registrar abono',
                            moneda: 'COP',
                            onOk: (m) => abonarPrestamo(p.id, m),
                          })
                        }
                        className="btn-soft mt-3.5 w-full"
                      >
                        Registrar abono
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <BotonNuevo onClick={() => setModalPrestamo(true)}>+ Nuevo préstamo</BotonNuevo>
        </>
      )}

      {/* Modales */}
      <ModalBolsillo
        abierto={modalBolsillo || !!editarBolsilloObj}
        bolsilloEditar={editarBolsilloObj}
        onCerrar={() => {
          setModalBolsillo(false)
          setEditarBolsilloObj(null)
        }}
      />
      <ModalConvertir bolsillo={convertirObj} onCerrar={() => setConvertirObj(null)} />
      <ModalPrestamo abierto={modalPrestamo} onCerrar={() => setModalPrestamo(false)} />
      <ModalMonto
        abierto={!!montoAccion}
        titulo={montoAccion?.titulo ?? ''}
        confirmar={montoAccion?.confirmar}
        moneda={montoAccion?.moneda}
        onConfirmar={(m) => montoAccion?.onOk(m)}
        onCerrar={() => setMontoAccion(null)}
      />
    </>
  )
}

function TabBtn({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={activo} className="seg-btn">
      {children}
    </button>
  )
}

function Vacio({ ico, titulo, texto }: { ico: IconName; titulo: string; texto: string }) {
  return (
    <div className="card mb-4 px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-verde-claro text-verde-medio">
        <Icon name={ico} className="h-7 w-7" />
      </div>
      <div className="text-[16px] font-semibold">{titulo}</div>
      <p className="mx-auto mt-1 max-w-xs text-[14px] text-gris">{texto}</p>
    </div>
  )
}

function BotonNuevo({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="btn-dashed md:max-w-xs">
      {children}
    </button>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className="btn-icon text-gris-claro">
      {children}
    </button>
  )
}
