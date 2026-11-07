import type { Vista } from '../App'
import { Icon, type IconName } from './Icon'

const TABS: { id: Vista; ico: IconName; lbl: string }[] = [
  { id: 'resumen', ico: 'home', lbl: 'Inicio' },
  { id: 'deudas', ico: 'card', lbl: 'Deudas' },
  { id: 'gastos', ico: 'chart', lbl: 'Gastos' },
  { id: 'plan', ico: 'target', lbl: 'Plan' },
  { id: 'ahorro', ico: 'piggy', lbl: 'Ahorro' },
  { id: 'perfil', ico: 'user', lbl: 'Perfil' },
]

/** Barra de navegación inferior. Solo móvil/tablet; en desktop se usa el Sidebar. */
export function NavBar({ activa, onCambiar }: { activa: Vista; onCambiar: (v: Vista) => void }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-linea bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-xl px-1">
        {TABS.map((t) => {
          const on = activa === t.id
          return (
            <button
              key={t.id}
              onClick={() => onCambiar(t.id)}
              aria-current={on ? 'page' : undefined}
              className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                on ? 'text-verde-medio' : 'text-gris'
              }`}
            >
              <span
                className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-200 ${
                  on ? 'bg-verde-claro' : ''
                }`}
              >
                <Icon name={t.ico} className="h-[22px] w-[22px]" strokeWidth={on ? 2 : 1.75} />
              </span>
              <span className={`text-[11px] leading-none ${on ? 'font-bold' : 'font-medium'}`}>
                {t.lbl}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
