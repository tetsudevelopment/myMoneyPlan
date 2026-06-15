import { useEffect, useState } from 'react'

// Evento no estándar de instalación PWA (Chromium).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Banner "Instalar" que aparece cuando el navegador ofrece instalar la PWA. */
export function InstallBanner() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setEvento(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!evento) return null

  const instalar = async () => {
    await evento.prompt()
    await evento.userChoice
    setEvento(null)
  }

  return (
    <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl bg-verde-claro px-3.5 py-3">
      <span className="text-xl">📲</span>
      <span className="flex-1 text-[12.5px] text-verde-medio">
        Instala Mi Plan en tu teléfono para abrirla como app
      </span>
      <button
        onClick={instalar}
        className="rounded-[9px] bg-verde-prof px-3.5 py-2 text-xs font-semibold text-white"
      >
        Instalar
      </button>
    </div>
  )
}
