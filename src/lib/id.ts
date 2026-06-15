// Genera IDs únicos con forma de UUID. Se usan tanto en local como en la nube,
// para que cada deuda/movimiento tenga el MISMO id en ambos lados (clave para
// poder editar y borrar de forma fiable). La columna id en Supabase es uuid,
// por eso el fallback también produce un UUID válido.

export function nuevoId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  // Fallback UUID v4 (por si randomUUID no existe)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16)
    const v = ch === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
