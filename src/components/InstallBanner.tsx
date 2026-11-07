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
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-verde-claro px-4 py-3">
      <span className="text-xl" aria-hidden>📲</span>
      <span className="flex-1 text-[13px] text-verde-medio">
        Instala Mi Plan en tu teléfono para abrirla como app
      </span>
      <button
        onClick={instalar}
        className="min-h-[44px] rounded-xl bg-verde-prof px-4 text-[13px] font-semibold text-white"
      >
        Instalar
      </button>
    </div>
  )
}
