import { useEffect, useRef } from 'react'

// Pila de listeners activos: Escape solo dispara el más reciente (el de arriba),
// así un diálogo apilado sobre un sheet no cierra ambos.
const pila: symbol[] = []

/** Llama a `onEscape` al presionar Escape mientras `activo`, solo si es el listener superior. */
export function useEscape(activo: boolean, onEscape: () => void): void {
  const cb = useRef(onEscape)
  cb.current = onEscape
  useEffect(() => {
    if (!activo) return
    const token = Symbol('escape')
    pila.push(token)
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pila[pila.length - 1] === token) cb.current()
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      const i = pila.indexOf(token)
      if (i >= 0) pila.splice(i, 1)
    }
  }, [activo])
}
