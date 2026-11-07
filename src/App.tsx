import { useState } from 'react'
import { Icon } from './components/Icon'
import { ModalRegistro } from './components/ModalRegistro'
import { NavBar } from './components/NavBar'
import { Sidebar } from './components/Sidebar'
import { AppProvider } from './store/AppContext'
import { Ahorro } from './views/Ahorro'
import { Deudas } from './views/Deudas'
import { Gastos } from './views/Gastos'
import { Inicio } from './views/Inicio'
import { Pareja } from './views/Pareja'
import { Perfil } from './views/Perfil'
import { Plan } from './views/Plan'

export type Vista = 'resumen' | 'deudas' | 'gastos' | 'plan' | 'ahorro' | 'pareja' | 'perfil'

const TITULOS: Record<Vista, [string, string]> = {
  resumen: ['Resumen', 'Tu camino a cero deudas'],
  deudas: ['Mis deudas', 'Ordenadas por estrategia de pago'],
  gastos: ['Gastos', '¿En qué se va tu dinero?'],
  plan: ['Mi plan', 'Tu estrategia para salir de deudas'],
  ahorro: ['Ahorro y préstamos', 'Tus bolsillos y el dinero que prestaste'],
  pareja: ['Plan en pareja', 'Gastos compartidos y reparto por ingreso'],
  perfil: ['Mi perfil', 'Tu cuenta y preferencias'],
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

function Shell() {
  const [vista, setVista] = useState<Vista>('resumen')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [abonoDeudaId, setAbonoDeudaId] = useState<string | null>(null)

  const abrirRegistro = () => {
    setAbonoDeudaId(null)
    setModalAbierto(true)
  }
  const abrirAbono = (deudaId: string) => {
    setAbonoDeudaId(deudaId)
    setModalAbierto(true)
  }
  const irA = (v: Vista) => {
    setVista(v)
    try {
      window.scrollTo(0, 0)
    } catch {
      /* jsdom u otros entornos sin scrollTo */
    }
  }

  const [titulo, sub] = TITULOS[vista]

  return (
    <div className="lg:flex lg:bg-crema">
      {/* Navegación lateral (desktop) */}
      <Sidebar activa={vista} onCambiar={irA} onRegistrar={abrirRegistro} />

      {/* Columna principal */}
      <div className="relative mx-auto min-h-screen w-full max-w-app pb-[calc(72px+env(safe-area-inset-bottom))] lg:max-w-none lg:flex-1 lg:pb-0">
        {/* Inicio trae su propio encabezado claro; las demás vistas usan el verde */}
        {vista !== 'resumen' && (
          <header className="relative overflow-hidden bg-verde-prof px-5 pb-5 pt-[calc(env(safe-area-inset-top)+18px)] text-crema lg:px-8 lg:pb-7 lg:pt-7">
            <div className="lg:mx-auto lg:max-w-5xl">
              <h1 className="text-[22px] font-bold leading-tight tracking-tight lg:text-2xl">{titulo}</h1>
              <p className="mt-1 text-[13px] text-crema/70 lg:text-sm">{sub}</p>
            </div>
          </header>
        )}

        <main
          className={`px-4 pb-6 lg:px-8 lg:pb-12 lg:pt-8 ${
            vista === 'resumen' ? 'pt-[calc(env(safe-area-inset-top)+16px)]' : 'pt-5'
          }`}
        >
          <div className="lg:mx-auto lg:max-w-5xl">
            {vista === 'resumen' && <Inicio onPerfil={() => irA('perfil')} />}
            {vista === 'deudas' && <Deudas onAbonar={abrirAbono} />}
            {vista === 'gastos' && <Gastos />}
            {vista === 'plan' && <Plan />}
            {vista === 'ahorro' && <Ahorro />}
            {vista === 'pareja' && <Pareja />}
            {vista === 'perfil' && <Perfil onAbrirPareja={() => irA('pareja')} />}
          </div>
        </main>

        {/* FAB (móvil/tablet) — oculto en Perfil, Ahorro y Pareja */}
        {vista !== 'perfil' && vista !== 'ahorro' && vista !== 'pareja' && (
          <button
            onClick={abrirRegistro}
            aria-label="Registrar movimiento"
            className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-verde-vivo text-white shadow-fab transition active:scale-90 sm:right-6 lg:hidden"
          >
            <Icon name="plus" className="h-7 w-7" strokeWidth={2.25} />
          </button>
        )}

        {/* Barra inferior (móvil/tablet) */}
        <NavBar activa={vista} onCambiar={irA} />
      </div>

      <ModalRegistro
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        abonoDeudaId={abonoDeudaId}
      />
    </div>
  )
}
